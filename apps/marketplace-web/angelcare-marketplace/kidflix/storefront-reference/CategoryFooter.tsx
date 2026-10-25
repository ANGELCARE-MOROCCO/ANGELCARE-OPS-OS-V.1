"use client";
import {KidFlixFooter} from "../personal/KidFlixFooter";
import {useDocumentsSettings} from "../documents/DocumentShell";
import type {Locale} from "../catalogue";
export function CategoryResourceFooter({locale,family}:{locale:Locale;family:string}){const {edition}=useDocumentsSettings();return <KidFlixFooter locale={locale} family={family} socialLinks={edition.documentsSocialLinks}/>;}
