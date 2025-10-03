// Complete types.ts file

export type ResumeNode = {
  uid: string;
  addr?: string;
  title: string;
  content?: string;
  meta?: {
    type?: NodeType;
    dateRange?: string;
    location?: string;
    company?: string;
    role?: string;
    tags?: string[];
    [key: string]: any;
  };
  children?: ResumeNode[];
};

export type NodeType = 
  | 'section' 
  | 'item' 
  | 'bullet' 
  | 'text' 
  | 'contact';

export type ResumeTree = ResumeNode[];

export type Numbering = {
  addrToUid: Record<string, string>;
  uidToAddr: Record<string, string>;
};

export type AgentAction = 
  | ReplaceAction
  | AppendBulletAction
  | AppendItemAction
  | AppendSectionAction
  | RemoveAction
  | MoveAction
  | ReorderAction
  | UpdateMetaAction;

export type ReplaceAction = {
  action: 'replace';
  id: string;
  text: string;
};

export type AppendBulletAction = {
  action: 'appendBullet';
  id: string;
  text: string;
};

export type AppendItemAction = {
  action: 'appendItem';
  id: string;
  title: string;
  content?: string;
  meta?: Record<string, any>;
};

export type AppendSectionAction = {
  action: 'appendSection';
  title: string;
  after?: string;
};

export type RemoveAction = {
  action: 'remove';
  id: string;
};

export type MoveAction = {
  action: 'move';
  id: string;
  newParent: string;
  position?: number;
};

export type ReorderAction = {
  action: 'reorder';
  id: string;
  order: string[];
};

export type UpdateMetaAction = {
  action: 'updateMeta';
  id: string;
  meta: Record<string, any>;
};
