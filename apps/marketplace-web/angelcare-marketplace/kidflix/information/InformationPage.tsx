'use client';
import type {Locale} from '../catalogue';
import type {InformationTopic} from './model';
import {About} from './About';
import {Accessibility} from './Accessibility';
import {Privacy} from './Privacy';
export function InformationPage({locale,topic}:{locale:Locale;topic:InformationTopic}){return topic==='about'?<About locale={locale}/>:topic==='accessibility'?<Accessibility locale={locale}/>:<Privacy locale={locale}/>;}
