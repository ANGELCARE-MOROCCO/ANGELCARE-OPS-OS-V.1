import { redirect } from 'next/navigation'
import styles from '@/components/angelcare360/material-command/MaterialCommand.module.css'
import { StewardshipMatrix } from '@/components/angelcare360/material-command/StewardshipMatrix'
import { MaterialCommandShell,SectionHero } from '@/components/angelcare360/material-command/MaterialCommandShell'
import { getMaterialSnapshot,listMaterialStaff } from '@/lib/angelcare360/server/inventory-material-command'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export default async function ResponsiblesPage(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/inventaire/responsables');const[s,staff]=await Promise.all([getMaterialSnapshot(),listMaterialStaff()]);if(!s)redirect('/angelcare-360-command-center');return <MaterialCommandShell schoolName={s.schoolName} academicYearLabel={s.academicYearLabel} integrity={s.integrity} activePath="/angelcare-360-command-center/inventaire/responsables"><section className={styles.sectionPage}><SectionHero eyebrow="MATERIAL STEWARDSHIP MATRIX" title="Responsabilités matérielles" description="La gouvernance physique devient visible: qui répond de quoi, où la pression se concentre, et quels articles restent sans responsable."/><StewardshipMatrix schoolId={s.schoolId} stewardship={s.stewardship} items={s.items} staff={staff}/></section></MaterialCommandShell>}
