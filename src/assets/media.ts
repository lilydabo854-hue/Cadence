import skincareSerumImg from './images/asset_skincare_serum_1794758874639.jpg';
import audioHeadphonesImg from './images/asset_audio_headphones_1794758874283.jpg';
import coffeePourImg from './images/asset_coffee_pour_1794758875033.jpg';
import canvaTemplateImg from './images/canva_template_launch_1794758875570.jpg';
import avatarTeamLeadImg from './images/avatar_team_lead_1794758875931.jpg';

export const MEDIA_REGISTRY: Record<string, string> = {
  asset_skincare_serum: skincareSerumImg,
  asset_audio_headphones: audioHeadphonesImg,
  asset_coffee_pour: coffeePourImg,
  canva_template_launch: canvaTemplateImg,
  avatar_team_lead: avatarTeamLeadImg,
};

export function resolveMediaUrl(mediaKey?: string): string | undefined {
  if (!mediaKey) return undefined;
  if (mediaKey.startsWith('data:') || mediaKey.startsWith('http') || mediaKey.startsWith('/')) {
    return mediaKey;
  }
  return MEDIA_REGISTRY[mediaKey];
}
