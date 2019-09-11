import { IGameTimelineApiData } from '../../lib/demacia/models';

const MID_LANE = [
  [4200, 3500],
  [11300, 10500],
  [13200, 13200],
  [10500, 11300],
  [3300, 4400],
  [1600, 1600],
];
const TOP_LANE = [
  [-120, 1600],
  [-120, 14980],
  [13200, 14980],
  [13200, 13200],
  [4000, 13200],
  [1600, 11000],
  [1600, 1600],
];
const BOT_LANE = [
  [1600, -120],
  [14870, -120],
  [14870, 13200],
  [13200, 13200],
  [13270, 4000],
  [10500, 1700],
  [1600, 1600],
];
const JUNGLE_1 = [
  [1600, 5000],
  [1600, 11000],
  [4000, 13200],
  [9800, 13200],
  [10500, 11300],
  [3300, 4400],
];
const JUNGLE_2 = [
  [5000, 1700],
  [4200, 3500],
  [11300, 10500],
  [13270, 9900],
  [13270, 4000],
  [10500, 1700],
];

function containPoint(polygon: number[][], point: number[]) {
  let crosses = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    if (polygon[i][1] > point[1] != polygon[j][1] > point[1]) {
      const atX =
        ((polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1])) /
          (polygon[j][1] - polygon[i][1]) +
        polygon[i][0];
      if (point[0] < atX) crosses++;
    }
  }

  return crosses % 2 > 0;
}

export function getLanesByCoor(timeline: IGameTimelineApiData, participantId: number) {
  const frames = timeline.frames;

  const result: string[] = [];
  for (let i = 1; i < 11; i++) {
    const frame = frames[i];

    if (frame) {
      for (const key in frame.participantFrames) {
        if (frame.participantFrames[key].participantId === participantId && frame.participantFrames[key].position) {
          const coors = [
            frame.participantFrames[key].position.x,
            frame.participantFrames[key].position.y,
          ];
          let position = 'UNKNOWN';
          if (containPoint(JUNGLE_1, coors) || containPoint(JUNGLE_2, coors)) {
            position = 'JUNGLE';
          } else if (containPoint(MID_LANE, coors)) {
            position = 'MID';
          } else if (containPoint(TOP_LANE, coors)) {
            position = 'TOP';
          } else if (containPoint(BOT_LANE, coors)) {
            position = 'BOTTOM';
          }
          result.push(position);
        }
      }
    }
  }

  return result;
}

export function getMostFrequentLane(timeline: IGameTimelineApiData, participantId: number) {
  type Lane = 'TOP' | 'JUNGLE' | 'MID' | 'BOTTOM';
  const lanes = getLanesByCoor(timeline, participantId);
  const frequency = {
    TOP: 0,
    JUNGLE: 0,
    MID: 0,
    BOTTOM: 0,
  };
  for (const lane of lanes) {
    if (lane !== 'UNKNOWN') {
      frequency[lane as Lane]++;
    }
  }

  let max = 0;
  let mostFrequncyLane = 'UNKNOWN';
  for (const lane in frequency) {
    if (frequency.hasOwnProperty(lane)) {
      if (max < frequency[lane as Lane]) {
        max = frequency[lane as Lane];
        mostFrequncyLane = lane;
      }
    }
  }

  return mostFrequncyLane;
}

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
  let result = [];
  for (let i = 0; i < timeline.frames.length; i++) {
    const events = timeline.frames[i].events;
    for (let j = 0; j < events.length; j++) {
      if (events[j].timestamp <= 1 * 60 * 1000 + 20 * 1000) {
        if (events[j].type === 'CHAMPION_KILL') {
          if (
            events[j].killerId === participantId ||
            events[j].assistingParticipantIds!.includes(participantId)
          ) {
            result.sort((a, b) => a - b);

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
        result.sort((a, b) => a - b);

        return result;
      }
    }
  }

  result.sort((a, b) => a - b);
  
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
