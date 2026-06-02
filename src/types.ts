export interface FacebookPage {
  id: string;
  name: string;
  token: string;
  isSimulated?: boolean;
}

export type PostType = 'text' | 'image' | 'video';

export interface DraftPost {
  type: PostType;
  message: string;
  mediaUrl?: string; // Image URL (public or data URL) or local file path
  mediaFileBase64?: string; // Optional raw base64 data for image/video upload
  mediaFileName?: string;
}

export interface PagePostResult {
  pageId: string;
  pageName: string;
  isSimulated: boolean;
  status: 'success' | 'failed';
  facebookPostId?: string;
  error?: string;
}

export interface PostHistoryItem {
  id: string;
  timestamp: string;
  type: PostType;
  message: string;
  mediaUrl?: string;
  results: PagePostResult[];
}
