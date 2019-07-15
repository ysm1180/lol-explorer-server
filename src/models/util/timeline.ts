import { IGameTimelineApiData } from '../../lib/demacia/models';

export function getPurchasedItemEvents(timeline: IGameTimelineApiData, participantId: number) {
  const result = [];
  for (let i = 0; i < timeline.frames.length; i++) {
    const events = timeline.frames[i].events;
    for (let j = 0; j < events.length; j++) {
      if (events[j].type === 'ITEM_PURCHASED' && events[j].participantId === participantId) {
        result.push({
          itemId: events[j].itemId,
          timestamp: events[j].timestamp,
        });
      }
    }
  }

  return result;
}

export function getSkillSlotEvents(timeline: IGameTimelineApiData, participantId: number) {
  const result = [];
  for (let i = 0; i < timeline.frames.length; i++) {
    const events = timeline.frames[i].events;
    for (let j = 0; j < events.length; j++) {
      if (events[j].type === 'SKILL_LEVEL_UP' && events[j].participantId === participantId) {
        result.push({
          skillSlot: events[j].skillSlot!,
          timestamp: events[j].timestamp,
        });
      }
    }
  }

  return result;
}
