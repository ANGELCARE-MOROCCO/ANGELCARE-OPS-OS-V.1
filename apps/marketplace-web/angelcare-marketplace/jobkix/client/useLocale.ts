'use client';
import { useParams } from 'next/navigation';
import { isLocale } from '../contracts';
export function useJobkixLocale(){const params=useParams();const value=params.locale;return typeof value==='string'&&isLocale(value)?value:'en';}
