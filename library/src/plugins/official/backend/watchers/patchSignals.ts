// Icon: material-symbols:settings-input-antenna
// Slug: Patches signals.
// Description: Patches signals.

import {
  DefaultMergeSignalsOnlyIfMissing,
  EventTypes,
} from '../../../../engine/consts'
import { PluginType, type WatcherPlugin } from '../../../../engine/types'
import { isBoolString, jsStrToObject } from '../../../../utils/text'
import { stateSSEEventWatcher } from '../shared'

export const PatchSignals: WatcherPlugin = {
  type: PluginType.Watcher,
  name: EventTypes.PatchSignals,
  onGlobalInit: (ctx) =>
    stateSSEEventWatcher(
      EventTypes.PatchSignals,
      ({
        signals: raw = '{}',
        onlyIfMissing: onlyIfMissingRaw = `${DefaultMergeSignalsOnlyIfMissing}`,
      }) =>
        ctx.signals.merge(jsStrToObject(raw), isBoolString(onlyIfMissingRaw)),
    ),
}