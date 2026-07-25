import { cleanString,fail,ok } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { getProposal,normalizeLinePayload,proposalContext,recordProposalEvent } from "@/lib/revenue-command-center/proposal-enterprise/server"

const PERMISSIONS:Record<string,string>={
  "select-opportunity":"revenue.proposals.manage","edit-line":"revenue.proposals.manage","optional-line":"revenue.proposals.manage","add-term":"revenue.proposals.manage",
  "pricing-approval":"revenue.pricing.manage","approve-proposal":"revenue.proposals.approve","reject-proposal":"revenue.proposals.approve","return-correction":"revenue.proposals.approve",
  "send-proposal":"revenue.proposals.send","revision-request":"revenue.proposals.manage","resolve-objection":"revenue.negotiations.manage",
  "approve-concession":"revenue.negotiations.approve","reject-concession":"revenue.negotiations.approve","negotiation-position":"revenue.negotiations.manage",
  "reject-outcome":"revenue.proposals.accept","withdraw-proposal":"revenue.proposals.manage","extend-validity":"revenue.proposals.manage","supersede-proposal":"revenue.proposals.manage",
}

export async function POST(request:Request){
  try{
    const body=await request.json(),operation=cleanString(body.operation)
    const permission=PERMISSIONS[operation]
    if(!permission)return fail("Commande commerciale non autorisée.",400)
    const {access,supabase}=await proposalContext(permission)
    const proposalId=cleanString(body.proposalId),proposal=proposalId?await getProposal(supabase,proposalId):null
    if(!proposal)return fail("Proposition introuvable.",404)
    const actorId=(access.user as any).id||null,now=new Date().toISOString()
    if(["sent","contract_ready","archived"].includes(proposal.status)&&["edit-line","optional-line","add-term"].includes(operation))return fail("La version envoyée ou finalisée ne peut pas être modifiée.",409)

    if(operation==="select-opportunity"){
      const opportunityId=cleanString(body.opportunityId),reason=cleanString(body.reason)
      if(!opportunityId||!reason)return fail("Opportunité et motif requis.",400)
      const opportunity=await supabase.from("revenue_opportunities").select("id,title,account_id,prospect_id").eq("id",opportunityId).maybeSingle()
      if(opportunity.error)return fail(opportunity.error)
      if(!opportunity.data)return fail("Opportunité introuvable.",404)
      const updated=await supabase.from("revenue_proposals").update({opportunity_id:opportunityId,account_id:proposal.account_id||opportunity.data.account_id||null,prospect_id:proposal.prospect_id||opportunity.data.prospect_id||null,last_activity_at:now,version:Number(proposal.version||1)+1,updated_by:actorId}).eq("id",proposalId).select("*").single()
      if(updated.error)return fail(updated.error)
      await recordProposalEvent(supabase,{proposal:updated.data,eventType:"proposal_opportunity_linked",title:"Opportunité reliée à la proposition",body:reason,result:{opportunityId}})
      return ok({proposal:updated.data})
    }

    if(operation==="edit-line"){
      const lineId=cleanString(body.lineId);if(!lineId)return fail("Ligne requise.",400)
      const row=normalizeLinePayload({...body,proposalId})
      const updated=await supabase.from("revenue_proposal_line_items").update({label:row.label,description:row.description,quantity:row.quantity,unit_price:row.unit_price,gross_value:row.gross_value,discount_value:row.discount_value,net_value:row.net_value,estimated_cost:row.estimated_cost,gross_margin:row.gross_margin,optional:row.optional,internal_only:row.internal_only,updated_by:actorId}).eq("id",lineId).eq("proposal_id",proposalId).is("proposal_version_id",null).select("*").single()
      if(updated.error)return fail(updated.error)
      await recordProposalEvent(supabase,{proposal,eventType:"proposal_line_updated",title:`Ligne corrigée : ${row.label}`,result:{lineId}})
      return ok({line:updated.data})
    }

    if(operation==="optional-line"){
      const row=normalizeLinePayload({...body,proposalId,optional:true})
      const inserted=await supabase.from("revenue_proposal_line_items").insert({...row,optional:true,created_by:actorId,updated_by:actorId}).select("*").single()
      if(inserted.error)return fail(inserted.error)
      await recordProposalEvent(supabase,{proposal,eventType:"proposal_optional_line_added",title:`Option commerciale ajoutée : ${row.label}`,result:{lineId:inserted.data.id}})
      return ok({line:inserted.data})
    }

    if(operation==="add-term"){
      const title=cleanString(body.title),customerContent=cleanString(body.customerContent)
      if(!title||!customerContent)return fail("Titre et condition client requis.",400)
      const inserted=await supabase.from("revenue_proposal_sections").insert({proposal_id:proposalId,section_key:cleanString(body.sectionKey,"commercial_terms"),title,customer_content:customerContent,internal_content:cleanString(body.internalContent),customer_visible:true,sort_order:99,created_by:actorId,updated_by:actorId}).select("*").single()
      if(inserted.error)return fail(inserted.error)
      await recordProposalEvent(supabase,{proposal,eventType:"proposal_term_added",title:`Condition commerciale ajoutée : ${title}`,result:{sectionId:inserted.data.id}})
      return ok({section:inserted.data})
    }

    if(operation==="pricing-approval"){
      const reason=cleanString(body.reason);if(!reason)return fail("Motif de soumission requis.",400)
      const approval=await supabase.from("revenue_proposal_approval_requests").insert({proposal_id:proposalId,proposal_version_id:proposal.active_version_id||null,request_type:"pricing",status:"requested",reason,evidence:{reference:cleanString(body.evidence)},requested_by:actorId}).select("*").single()
      if(approval.error)return fail(approval.error)
      const updated=await supabase.from("revenue_proposals").update({status:"approval_required",approval_status:"requested",last_activity_at:now,version:Number(proposal.version||1)+1,updated_by:actorId}).eq("id",proposalId).select("*").single()
      if(updated.error)return fail(updated.error)
      await recordProposalEvent(supabase,{proposal:updated.data,eventType:"pricing_approval_requested",title:"Approbation tarifaire demandée",body:reason,result:{approvalId:approval.data.id}})
      return ok({approval:approval.data,proposal:updated.data})
    }

    if(["approve-proposal","reject-proposal","return-correction"].includes(operation)){
      const reason=cleanString(body.reason);if(!reason)return fail("Motif de décision requis.",400)
      const decision=operation==="approve-proposal"?"approved":operation==="reject-proposal"?"rejected":"correction_required"
      if(decision==="approved"&&Number(proposal.net_value||0)<=0)return fail("Une proposition sans valeur nette ne peut pas être approuvée.",409)
      if(decision==="approved"&&Number(proposal.margin_percent||0)<Number(proposal.minimum_margin_percent||25)){
        const exception=await supabase.from("revenue_margin_exceptions").select("id").eq("proposal_id",proposalId).eq("status","approved").order("created_at",{ascending:false}).limit(1).maybeSingle()
        if(exception.error)return fail(exception.error);if(!exception.data)return fail("Une exception de marge approuvée est requise.",409)
      }
      const approval=await supabase.from("revenue_proposal_approval_requests").insert({proposal_id:proposalId,proposal_version_id:proposal.active_version_id||null,request_type:"proposal",status:decision,reason,evidence:{reference:cleanString(body.evidence)},requested_by:actorId,decided_by:actorId,decided_at:now}).select("*").single()
      if(approval.error)return fail(approval.error)
      const status=decision==="approved"?"approved":"pricing_review"
      const updated=await supabase.from("revenue_proposals").update({status,approval_status:decision,last_activity_at:now,version:Number(proposal.version||1)+1,updated_by:actorId}).eq("id",proposalId).select("*").single()
      if(updated.error)return fail(updated.error)
      if(proposal.active_version_id){const version=await supabase.from("revenue_proposal_versions").update({approval_status:decision}).eq("id",proposal.active_version_id);if(version.error)return fail(version.error)}
      await recordProposalEvent(supabase,{proposal:updated.data,eventType:`proposal_approval_${decision}`,title:`Décision proposition : ${decision}`,body:reason,result:{approvalId:approval.data.id}})
      return ok({approval:approval.data,proposal:updated.data})
    }

    if(operation==="send-proposal"){
      if(proposal.approval_status!=="approved"||!proposal.active_version_id)return fail("Version approuvée et immuable requise avant envoi.",409)
      const recipientAddress=cleanString(body.recipientAddress),providerReference=cleanString(body.providerReference),sentAt=cleanString(body.sentAt)
      if(!recipientAddress||!providerReference||!sentAt)return fail("Destinataire, référence fournisseur et date d’envoi requis.",400)
      const recipient=await supabase.from("revenue_proposal_recipients").insert({proposal_id:proposalId,proposal_version_id:proposal.active_version_id,name:cleanString(body.recipientName),address:recipientAddress,channel:cleanString(body.channel,"email"),created_by:actorId}).select("*").single()
      if(recipient.error)return fail(recipient.error)
      const transmission=await supabase.from("revenue_proposal_transmissions").insert({proposal_id:proposalId,proposal_version_id:proposal.active_version_id,recipient_id:recipient.data.id,channel:cleanString(body.channel,"email"),subject:cleanString(body.subject),message:cleanString(body.message),status:"sent",provider_reference:providerReference,sent_at:new Date(sentAt).toISOString(),idempotency_key:cleanString(body.idempotencyKey)||`provider:${providerReference}`,created_by:actorId}).select("*").single()
      if(transmission.error)return fail(transmission.error)
      await supabase.from("revenue_proposals").update({status:"sent",recipient_status:"sent",last_activity_at:now,version:Number(proposal.version||1)+1,updated_by:actorId}).eq("id",proposalId)
      await recordProposalEvent(supabase,{proposal,eventType:"proposal_sent",title:"Envoi externe confirmé",result:{transmissionId:transmission.data.id,providerReference}})
      return ok({recipient:recipient.data,transmission:transmission.data})
    }

    if(operation==="revision-request"){
      const summary=cleanString(body.summary);if(!summary)return fail("Résumé de révision requis.",400)
      const response=await supabase.from("revenue_proposal_responses").insert({proposal_id:proposalId,proposal_version_id:proposal.active_version_id||null,response_type:"revision_requested",summary,received_at:cleanString(body.receivedAt)||now,next_action:cleanString(body.nextAction),evidence:cleanString(body.evidence),recorded_by:actorId}).select("*").single()
      if(response.error)return fail(response.error)
      await supabase.from("revenue_proposals").update({status:"revision_requested",recipient_status:"revision_requested",next_action:cleanString(body.nextAction,"Préparer une nouvelle version"),last_activity_at:now,version:Number(proposal.version||1)+1,updated_by:actorId}).eq("id",proposalId)
      await recordProposalEvent(supabase,{proposal,eventType:"proposal_revision_requested",title:"Révision demandée par le client",body:summary,result:{responseId:response.data.id}})
      return ok({response:response.data})
    }

    if(operation==="resolve-objection"){
      const objectionId=cleanString(body.objectionId),resolution=cleanString(body.resolution);if(!objectionId||!resolution)return fail("Objection et résolution requises.",400)
      const updated=await supabase.from("revenue_proposal_objections").update({resolution_status:cleanString(body.resolutionStatus,"resolved"),resolution,resolved_by:actorId,resolved_at:now}).eq("id",objectionId).eq("proposal_id",proposalId).select("*").single()
      if(updated.error)return fail(updated.error)
      await recordProposalEvent(supabase,{proposal,eventType:"proposal_objection_resolved",title:"Objection résolue",body:resolution,result:{objectionId}})
      return ok({objection:updated.data})
    }

    if(operation==="approve-concession"||operation==="reject-concession"){
      const concessionId=cleanString(body.concessionId),reason=cleanString(body.reason),decision=operation==="approve-concession"?"approved":"rejected"
      if(!concessionId||!reason)return fail("Concession et motif requis.",400)
      const updated=await supabase.from("revenue_concession_requests").update({status:decision,decided_by:actorId,decision_reason:reason,decided_at:now}).eq("id",concessionId).eq("proposal_id",proposalId).eq("status","requested").select("*").single()
      if(updated.error)return fail(updated.error)
      await supabase.from("revenue_negotiations").update({status:decision==="approved"?"response_prepared":"open",updated_by:actorId,updated_at:now}).eq("id",updated.data.negotiation_id)
      await recordProposalEvent(supabase,{proposal,eventType:`proposal_concession_${decision}`,title:`Concession ${decision}`,body:reason,result:{concessionId}})
      return ok({concession:updated.data})
    }

    if(operation==="negotiation-position"){
      const negotiationId=cleanString(body.negotiationId),party=cleanString(body.party),positionText=cleanString(body.positionText)
      if(!negotiationId||!["angelcare","customer"].includes(party)||!positionText)return fail("Négociation, partie et position requises.",400)
      const round=await supabase.from("revenue_negotiation_rounds").select("id,round_number").eq("negotiation_id",negotiationId).eq("status","open").order("round_number",{ascending:false}).limit(1).maybeSingle();if(round.error)return fail(round.error)
      const inserted=await supabase.from("revenue_negotiation_positions").insert({negotiation_id:negotiationId,round_id:round.data?.id||null,party,position_value:Math.max(0,Number(body.positionValue||0)),position_text:positionText,recorded_by:actorId}).select("*").single();if(inserted.error)return fail(inserted.error)
      const field=party==="angelcare"?{angelcare_position_value:inserted.data.position_value}:{customer_position_value:inserted.data.position_value}
      await supabase.from("revenue_negotiations").update({...field,updated_by:actorId,updated_at:now}).eq("id",negotiationId)
      await recordProposalEvent(supabase,{proposal,eventType:`negotiation_position_${party}`,title:`Position ${party} enregistrée`,body:positionText,result:{positionId:inserted.data.id}})
      return ok({position:inserted.data})
    }

    if(operation==="reject-outcome"){
      const input={...body,evidence:body.evidence&&typeof body.evidence==="object"?body.evidence:{}}
      const result=await supabase.rpc("revenue_apply_commercial_outcome",{p_proposal_id:proposalId,p_input:input,p_actor_id:actorId})
      if(result.error)return fail(result.error)
      return ok({outcome:Array.isArray(result.data)?result.data[0]:result.data})
    }

    if(operation==="extend-validity"){
      const validityUntil=cleanString(body.validityUntil),reason=cleanString(body.reason);if(!validityUntil||!reason)return fail("Nouvelle validité et justification requises.",400)
      const updated=await supabase.from("revenue_proposals").update({validity_until:validityUntil,last_activity_at:now,version:Number(proposal.version||1)+1,updated_by:actorId}).eq("id",proposalId).select("*").single();if(updated.error)return fail(updated.error)
      await recordProposalEvent(supabase,{proposal:updated.data,eventType:"proposal_validity_extended",title:"Validité prolongée",body:reason,result:{validityUntil}})
      return ok({proposal:updated.data})
    }

    const target=operation==="withdraw-proposal"?"withdrawn":"superseded",reason=cleanString(body.reason)
    if(!reason)return fail("Motif obligatoire.",400)
    const updated=await supabase.from("revenue_proposals").update({status:target,next_action:operation==="supersede-proposal"?`Remplacée par ${cleanString(body.replacementReference,"une nouvelle proposition")}`:"Aucune action active",last_activity_at:now,version:Number(proposal.version||1)+1,updated_by:actorId}).eq("id",proposalId).select("*").single()
    if(updated.error)return fail(updated.error)
    await recordProposalEvent(supabase,{proposal:updated.data,eventType:`proposal_${target}`,title:`Proposition ${target}`,body:reason})
    return ok({proposal:updated.data})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
