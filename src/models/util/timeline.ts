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

export function getPurchasedItemEvents(timeline: IGameTimelineApiData, participantId: number) {
  const result = [];
  for (let i = 0; i < timeline.frames.length; i++) {
    const events = timeline.frames[i].events;
    for (let j = 0; j < events.length; j++) {
      if (events[j].type === 'ITEM_PURCHASED' && events[j].participantId === participantId) {
        result.push({
          itemId: events[j].itemId!,
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
