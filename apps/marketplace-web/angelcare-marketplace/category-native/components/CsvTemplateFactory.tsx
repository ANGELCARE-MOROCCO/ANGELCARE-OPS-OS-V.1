'use client'
import type {ExperienceSchemaRecord} from '../types'
import {ImportWorkspace} from '../../catalogue-import/ImportWorkspace'
export function CsvTemplateFactory({schemas}:{schemas:ExperienceSchemaRecord[]}){return <ImportWorkspace initialSchemas={schemas} permissions={{manage:false,media:false,categories:false,export:false,publish:false}}/>}
