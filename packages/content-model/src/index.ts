// Types
export type {
  NarrativeBlock,
  NarrativeMeta,
  NarrativeOutput,
  NarrativeViewConfig,
  TimelineEntry,
  Template,
  WeightedMask,
  MaskedProfile,
  TimelineRenderOptions,
} from './types';
export type { Personality, Setting } from '@in-midst-my-life/schema';

// Taxonomy (static definitions)
export {
  EPOCH_MASK_MODIFIERS,
  EPOCH_TAXONOMY,
  MASK_PERSONALITY_RELATIONS,
  MASK_STAGE_AFFINITIES,
  MASK_TAXONOMY,
  PERSONALITY_TAXONOMY,
  SETTING_TAXONOMY,
  STAGE_SETTING_RELATIONS,
  STAGE_TAXONOMY,
} from './taxonomy';

// Templates
export {
  BASE_TEMPLATES,
  EPOCH_TEMPLATES,
  MASK_TEMPLATES,
  SPEC_TEMPLATES,
  TEMPLATE_BANK,
  TIMELINE_TEMPLATES,
  filterTemplatesByScore,
  interpolate,
  sortTemplatesByWeight,
} from './templates';

// Timeline processing
export {
  buildArc,
  buildEpochMap,
  buildEvidenceLine,
  buildSettingMap,
  buildStageEpochMap,
  buildStageMap,
  enrichTimelineEntry,
  formatEpoch,
  formatStage,
  formatTimeline,
  formatTimelineEntry,
  inferStageForEntry,
  maskStageAffinity,
  maskWeightForEntry,
  recencyWeight,
  renderTimeline,
  renderTimelineForMask,
  resolveEpochs,
  resolveSettings,
  resolveStages,
} from './timeline';

// Mask selection
export {
  epochMaskModifier,
  maskWeight,
  scoreMaskForView,
  selectBestMask,
  selectMasksForView,
  selectWeightedMasks,
  stageWeight,
} from './mask-selection';

// Narrative generation
export {
  applyMask,
  buildNarrative,
  buildNarrativeOutput,
  buildNarrativeWithEpochs,
  buildNarrativeWithTimeline,
  buildWeightedNarrative,
} from './narrative';

// Weighting (block scoring)
export * from './weighting';

// LLM provider
export * from './llm-provider';

// JSON-LD exports
export * from './json-ld';

// Compatibility utilities
export * from './compatibility';

// Role-family taxonomy
export * from './role-families';

// Academic domain (role families + CV rendering)
export * from './academic';

// Tone analysis
export * from './tone';

// Follow-up question generation
export * from './follow-up-generator';
