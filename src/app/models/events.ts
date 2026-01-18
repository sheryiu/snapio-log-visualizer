export type InterActorCommunicationEvent = {
  __id: string;
  __type: 'InterActorCommunicationEvent';
  __time: Date;
  eventSent?: EventSentContent;
  eventReceived?: EventReceivedContent;
}

type EventSentContent = {
  timestamp: string;
  level: string;
  version: string;
  boothId: string;
  message: string;
  fromActor: string;
  toActor: string;
  event?: any;
}

type EventReceivedContent = {
  timestamp: string;
  level: string;
  version: string;
  boothId: string;
  message: string;
  atActor: string;
  event?: any;
}

export type ActorInitializationEvent = {
  __id: string;
  __type: 'ActorInitializationEvent';
  __time: Date;
  timestamp: string;
  level: string;
  version: string;
  boothId: string;
  message: string;
  inActor: string;
  actor: string;
  input?: any;
}

export type ActorFinalizationEvent = {
  __id: string;
  __type: 'ActorFinalizationEvent';
  __time: Date;
  timestamp: string;
  level: string;
  version: string;
  boothId: string;
  message: string;
  actor: string;
  inActor: string;
  output?: any;
}

export type ViewTransitionEvent = {
  __id: string;
  __type: 'ViewTransitionEvent';
  __time: Date;
  start?: ViewTransition;
  end?: ViewTransition;
}

type ViewTransition = {
  timestamp: string;
  level: string;
  version: string;
  boothId: string;
  message: string;
  from: string;
  to: string;
}

export type ErrorEvent = {
  __id: string;
  __type: 'ErrorEvent';
  __time: Date;
  timestamp: string;
  level: string;
  version: string;
  boothId: string;
  message: string;
  code: string;
  showErrorPage: boolean;
}

export type ExtraLogEvent = {
  __id: string;
  __type: 'ExtraLogEvent';
  __time: Date;
  timestamp: string;
  level: string;
  version: string;
  boothId: string;
  message: string;
  function?: string;
}

export type SnapioEvent = InterActorCommunicationEvent | ActorInitializationEvent | ActorFinalizationEvent | ViewTransitionEvent | ErrorEvent | ExtraLogEvent;