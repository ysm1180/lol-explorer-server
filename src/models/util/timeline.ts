import { IGameTimelineApiData } from '../../lib/demacia/models';

export function getItemEvents(timeline: IGameTimelineApiData, participantId: number) {
  const result = [];
  for (let i = 0; i < timeline.frames.length; i++) {
    const events = timeline.frames[i].events;
    for (let j = 0; j < events.length; j++) {
      if (
        (events[j].type === 'ITEM_PURCHASED' ||
          events[j].type === 'ITEM_SOLD' ||
          events[j].type === 'ITEM_DESTROYED') &&
        events[j].participantId === participantId
      ) {
        result.push({
          type: events[j].type,
          itemId: events[j].itemId!,
          timestamp: events[j].timestamp,
        });
      } else if (events[j].type === 'ITEM_UNDO' && events[j].participantId === participantId) {
        result.push({
          type: events[j].type,
          itemId: events[j].beforeId!,
          timestamp: events[j].timestamp,
        });
      }
    }
  }

  return result;
}

export function getSkillLevelupSlots(timeline: IGameTimelineApiData, participantId: number) {
  const result = [];
  for (let i = 0; i < timeline.frames.length; i++) {
    const events = timeline.frames[i].events;
    for (let j = 0; j < events.length; j++) {
      if (events[j].type === 'SKILL_LEVEL_UP' && events[j].participantId === participantId) {
        result.push(events[j].skillSlot!);
      }
    }
  }

  return result;
}

export function getStartItemIdList(timeline: IGameTimelineApiData, participantId: number) {
  const result = [];
  for (let i = 0; i < timeline.frames.length; i++) {
    const events = timeline.frames[i].events;
    for (let j = 0; j < events.length; j++) {
      if (events[j].timestamp <= 1 * 60 * 1000 + 40 * 1000) {
        if (events[j].type === 'CHAMPION_KILL') {
          if (
            events[j].killerId === participantId ||
            events[j].assistingParticipantIds!.includes(participantId)
          ) {
            return result;
          }
        }

        if (events[j].type === 'ITEM_PURCHASED' && events[j].participantId === participantId) {
          const itemId = events[j].itemId!;
          if (itemId !== 3340 && itemId !== 3364) {
            result.push(itemId);
          }
        } else if (events[j].type === 'ITEM_UNDO' && events[j].participantId === participantId) {
          const index = result.indexOf(events[j].beforeId!);
          if (index !== -1) {
            result.splice(index, 1);
          }
        }
      } else {
        return result;
      }
    }
  }

  return result;
}

export function getSoloKills(timeline: IGameTimelineApiData, killerId: number, victimId: number) {
  let result = 0;
  for (let i = 0; i < timeline.frames.length; i++) {
    const events = timeline.frames[i].events;
    for (let j = 0; j < events.length; j++) {
      if (events[j].type === 'CHAMPION_KILL') {
        if (
          events[j].killerId === killerId &&
          events[j].victimId === victimId &&
          events[j].assistingParticipantIds!.length === 0
        ) {
          result++;
        }
      }
    }
  }

  return result;
}
