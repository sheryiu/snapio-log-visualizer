import { isPlatformBrowser } from '@angular/common';
import { Component, computed, effect, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { HoverableDirective } from 'portal-ui-ng/base';
import { SnackbarService } from 'portal-ui-ng/components';
import { ACTORS } from '../../models/actors';
import { ActorFinalizationEvent, ActorInitializationEvent, ErrorEvent, InterActorCommunicationEvent, SnapioEvent } from '../../models/events';
import { OrganizedEvents } from '../../models/organized-events';

@Component({
  selector: 'app-visualize',
  imports: [HoverableDirective],
  templateUrl: './visualize.html',
  styleUrl: './visualize.css',
})
export class Visualize {
  fileName = input<string>();
  private snackbar = inject(SnackbarService)

  isParsing = signal(false);
  private events = signal<SnapioEvent[]>([]);
  organizedEvents = computed(() => this.organizeEvents(this.events()));
  actors = ACTORS;

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      effect(() => {
        const fileName = this.fileName();
        if (fileName) {
          this.initiateVisualization(fileName);
        }
      })
    }
  }

  private async initiateVisualization(fileName: string): Promise<void> {
    try {
      const root = await navigator.storage.getDirectory();
      const logsDir = await root.getDirectoryHandle('logs');
      const fileHandle = await logsDir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const content = await file.text();

      await this.parseLogs(content);
    } catch (e) {
      console.error('Error initiating:', e);
      this.snackbar.openError(e instanceof Error ? e : `Unknown error occurred while initiating visualization, ${ e }`);
    }
  }

  private async parseLogs(content: string): Promise<void> {
    this.isParsing.set(true);
    const lines = content.split('\n');
    const events: SnapioEvent[] = [];
    for (const line of lines) {
      if (line.trim().length === 0) {
        continue;
      }
      try {
        const asJson = JSON.parse(line.trim());
        if ('message' in asJson && 'timestamp' in asJson) {
          if (asJson.message == 'Initialized actor') {
            events.push({
              __id: `ai.${ asJson.actor }.${ asJson.inActor }.${ asJson.timestamp }`,
              __type: 'ActorInitializationEvent',
              __time: new Date(asJson.timestamp),
              ...asJson
            } as ActorInitializationEvent);
          } else if (asJson.message == 'Finalized actor') {
            events.push({
              __id: `af.${ asJson.actor }.${ asJson.inActor }.${ asJson.timestamp }`,
              __type: 'ActorFinalizationEvent',
              __time: new Date(asJson.timestamp),
              ...asJson
            } as ActorFinalizationEvent);
          } else if (asJson.level == 'error') {
            events.push({
              __id: `err.${ asJson.code }.${ asJson.timestamp }`,
              __type: 'ErrorEvent',
              __time: new Date(asJson.timestamp),
              ...asJson
            } as ErrorEvent);
          } else if (asJson.message == "Event sent" && 'event' in asJson && 'type' in asJson.event) {
            events.push({
              __id: `iac.${ asJson.fromActor }.${ asJson.toActor }.${ asJson.event.type }.${ asJson.timestamp }`,
              __type: 'InterActorCommunicationEvent',
              __time: new Date(asJson.timestamp),
              eventSent: asJson,
            } as InterActorCommunicationEvent)
          } else if (asJson.message == "Event received" && 'event' in asJson && 'type' in asJson.event) {
            const time = new Date(asJson.timestamp);
            const iacSentEvent = events.find((e): e is InterActorCommunicationEvent =>
              e.__time >= new Date(time.getTime() - 1) && e.__time <= new Date(time.getTime() + 1)
              && e.__type == 'InterActorCommunicationEvent'
              && e.eventSent?.toActor == asJson.atActor
              && e.eventSent?.event?.type == asJson.event?.type
              && e.eventReceived == null);
            if (iacSentEvent) {
              iacSentEvent.eventReceived = asJson;
            } else {
              events.push({
                __id: `iac.${ asJson.atActor }.${ asJson.event.type }.${ asJson.timestamp }`,
                __type: 'InterActorCommunicationEvent',
                __time: new Date(asJson.timestamp),
                eventReceived: asJson,
              } as InterActorCommunicationEvent)
            }
          }
        }
      } catch (e) {
        console.error(`Error parsing logs (line ${line}):`, e);
        this.snackbar.openError(e instanceof Error ? e : `Unknown error occurred while parsing logs, ${ e }`);
        continue;
      }
    }
    this.isParsing.set(false);
    this.events.set(events);
  }

  private organizeEvents(events: SnapioEvent[]): OrganizedEvents {
    const byYear = Object.entries(Object.groupBy(events, (event) => event.__time.getFullYear()))
      .map(([year, yearEvents]) => {
        return {
          year,
          byMonth: Object.entries(Object.groupBy(yearEvents ?? [], (event) => event.__time.getMonth()))
            .map(([month, monthEvents]) => {
              return {
                month: (Number(month) + 1).toString().padStart(2, '0'),
                byDay: Object.entries(Object.groupBy(monthEvents ?? [], (event) => event.__time.getDate()))
                  .map(([day, dayEvents]) => {
                    return {
                      day: day.padStart(2, '0'),
                      byHour: Object.entries(Object.groupBy(dayEvents ?? [], (event) => event.__time.getHours()))
                        .map(([hour, hourEvents]) => {
                          return {
                            hour: hour.padStart(2, '0'),
                            byMinute: Object.entries(Object.groupBy(hourEvents ?? [], (event) => event.__time.getMinutes()))
                              .map(([minute, minuteEvents]) => {
                                return {
                                  minute: minute.padStart(2, '0'),
                                  bySecond: Object.entries(Object.groupBy(minuteEvents ?? [], (event) => event.__time.getSeconds()))
                                    .map(([second, secondEvents]) => {
                                      return {
                                        second: second.padStart(2, '0'),
                                        events: (secondEvents ?? [])
                                          .toSorted((a, b) => a.__time.getTime() - b.__time.getTime())
                                          .map((event) => {
                                            const from = (event.__type == 'InterActorCommunicationEvent')
                                              ? event.eventSent?.fromActor
                                              : (event.__type == 'ActorInitializationEvent')
                                              ? event.inActor
                                              : (event.__type == 'ActorFinalizationEvent')
                                              ? event.actor
                                              : null;
                                            const to = (event.__type == 'InterActorCommunicationEvent')
                                              ? event.eventReceived?.atActor ?? event.eventSent?.toActor
                                              : (event.__type == 'ActorInitializationEvent')
                                              ? event.actor
                                              : (event.__type == 'ActorFinalizationEvent')
                                              ? event.inActor
                                              : null;
                                            const direction: "LEFT" | "RIGHT" | "NONE" = (from && to)
                                              ? (ACTORS.indexOf(from) < ACTORS.indexOf(to)
                                                ? 'RIGHT'
                                                : (ACTORS.indexOf(from) > ACTORS.indexOf(to)
                                                  ? 'LEFT'
                                                  : 'NONE'))
                                              : 'NONE';
                                            const fromActor = ACTORS.includes(from!) ? from! : 'anonymous';
                                            const toActor = ACTORS.includes(to!) ? to! : 'anonymous';
                                            return {
                                              event,
                                              direction: direction,
                                              millisecond: event.__time.getMilliseconds().toString().padStart(3, '0'),
                                              actorAction: {
                                                [fromActor]: 'FROM' as const,
                                                [toActor]: 'TO' as const,
                                                // ...(from ? { [from]: 'FROM' as const } : {}),
                                                // ...(to ? { [to]: 'TO' as const } : {}),
                                              }
                                            }
                                          })
                                      };
                                    })
                                };
                              })
                          };
                        })
                    };
                  })
              };
            })
        }
      });
    return { byYear };
  }
}
