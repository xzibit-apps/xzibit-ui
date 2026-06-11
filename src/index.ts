/**
 * @xzibit/ui — entry point.
 *
 * Shared chrome components for the Xzibit Apps portfolio.
 * Single source of truth — tweak once, every app picks it up on next deploy.
 */

export { TopBar } from './TopBar';
export type { TopBarProps } from './TopBar';

export { BackToLauncher } from './BackToLauncher';
export type { BackToLauncherProps } from './BackToLauncher';

export { AppsDropdown } from './AppsDropdown';
export type { AppsDropdownProps } from './AppsDropdown';

export { XzibitMark } from './XzibitMark';
export type { XzibitMarkProps } from './XzibitMark';

export { XzibitWordmark } from './XzibitWordmark';
export type { XzibitWordmarkProps } from './XzibitWordmark';

export { FeedbackButton } from './FeedbackButton';
export type { FeedbackButtonProps } from './FeedbackButton';

export { FeedbackPanel } from './FeedbackPanel';
export type { FeedbackPanelProps, FeedbackPayload, FeedbackType } from './FeedbackPanel';

export { ScreenshotAnnotator } from './ScreenshotAnnotator';
export type { ScreenshotAnnotatorProps } from './ScreenshotAnnotator';

export { installDiagnostics, collectClientDiagnostics, scrub } from './diagnostics';
export type { ClientDiagnostics, DiagError, FailedRequest } from './diagnostics';

export { useApps } from './useApps';
export type { UseAppsResult, UseAppsOptions } from './useApps';

export { ContentContainer } from './ContentContainer';
export type { ContentContainerProps, ContentTier } from './ContentContainer';

export { BuildBadge } from './BuildBadge';
export type { BuildBadgeProps } from './BuildBadge';

export type { App, RawApp, AppsResponse } from './types';
export { normalizeApp } from './types';
