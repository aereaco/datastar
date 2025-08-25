import { DSP } from '../engine/consts'
// @ts-ignore
const _ = DSP // This is to force the import of DSP first in the compiled code

import { Computed } from '../modules/core/attributes/computed'
import { Signals } from '../modules/core/attributes/signals'
import { Star } from '../modules/core/attributes/star'
import { apply, load, setAlias } from './engine'

load(Star, Signals, Computed)

export { apply, load, setAlias }
