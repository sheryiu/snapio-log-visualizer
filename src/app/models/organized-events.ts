import { Actors } from './actors';
import { SnapioEvent } from './events';

export type OrganizedEvents = {
  byYear: {
    year: string;
    byMonth: {
      month: string;
      byDay: {
        day: string;
        byHour: {
          hour: string;
          byMinute: {
            minute: string;
            bySecond: {
              second: string;
              events: {
                actorAction: Partial<Record<Actors, ActorActionType>>;
                direction: 'LEFT' | 'RIGHT' | 'NONE';
                event: SnapioEvent;
              }[];
            }[];
          }[];
        }[];
      }[];
    }[];
  }[];
}

export type ActorActionType = 'FROM' | 'TO' | 'ANY'