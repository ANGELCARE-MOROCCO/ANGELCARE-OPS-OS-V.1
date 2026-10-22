import { Fragment } from 'react';
import { reviewedSegments } from '../reviewed-links';
/** Only used with text from the current reviewed publication; authored HTML is never executed. */
export function ReviewedText({value}:{value:string}){return reviewedSegments(value).map((segment,index)=>segment.href?<a href={segment.href} key={index} rel="noreferrer noopener">{segment.text}</a>:<Fragment key={index}>{segment.text}</Fragment>);}
