/** Empty slots occupy no space; campaigns populate only eligible native contexts. */
export function LiveExperienceSlot({name,itemId}:{name:string;itemId?:string}){return <div data-live-slot={name} data-live-item-id={itemId} />}
