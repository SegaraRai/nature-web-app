import { type UseTimeAgoUnitNamesDefault, formatTimeAgo } from "@vueuse/core";
import { type NatureDeviceWithEvents } from "./natureTypes";

export interface NatureDeviceSensorItemBase {
  readonly class: string;
  readonly icon: string;
  readonly label: string;
  readonly unit: string;
  readonly available: boolean;
  readonly value?: string;
  readonly timestamp?: string;
  readonly ago?: string;
}

export interface NatureDeviceSensorItemAvailable
  extends NatureDeviceSensorItemBase {
  readonly available: true;
  readonly value: string;
  readonly timestamp: string;
  readonly ago: string;
}

export interface NatureDeviceSensorItemNotAvailable
  extends NatureDeviceSensorItemBase {
  readonly available: false;
  readonly value?: undefined;
  readonly timestamp?: undefined;
  readonly ago?: undefined;
}

export type NatureDeviceSensorItem =
  | NatureDeviceSensorItemAvailable
  | NatureDeviceSensorItemNotAvailable;

export function useNatureDeviceSensors(
  device: MaybeRef<NatureDeviceWithEvents | null | undefined>,
  includesNA = false
) {
  const now = useNow({
    interval: 30_000,
  });
  return computed<readonly NatureDeviceSensorItem[]>(() => {
    const events = unref(device)?.newest_events;
    if (!events) {
      return [];
    }
    return [
      {
        class: "text-orange-400",
        icon: "i-mingcute-high-temperature-line",
        label: "室温",
        unit: "\u00BAC",
        object: events.te,
      },
      {
        class: "text-blue-400",
        icon: "i-mingcute-drop-line",
        label: "湿度",
        unit: "%",
        object: events.hu,
      },
      {
        class: "text-yellow-400",
        icon: "i-mingcute-light-line",
        label: "明るさ",
        unit: "lx",
        object: events.il,
      },
    ]
      .map((item): NatureDeviceSensorItem | undefined => {
        const { object, ...rest } = item;
        if (!object) {
          if (includesNA) {
            return { ...rest, available: false };
          }
          return;
        }
        return {
          ...rest,
          available: true,
          value: object.val.toString(),
          timestamp: object.created_at,
          ago: formatTimeAgo<UseTimeAgoUnitNamesDefault>(
            new Date(object.created_at),
            {
              messages: {
                year: (n: number) => `${n}年`,
                month: (n: number) => `${n}ヶ月`,
                week: (n: number) => `${n}週間`,
                day: (n: number) => `${n}日`,
                hour: (n: number) => `${n}時間`,
                minute: (n: number) => `${n}分`,
                second: (n: number) => `${n}秒`,
                future: (v: string) => `${v}後に`,
                past: (v: string) => `${v}前に`,
                invalid: "無効な時刻に",
                justNow: "たった今",
              },
            },
            now.value
          ),
        };
      })
      .filter((v): v is NonNullable<typeof v> => !!v);
  });
}
