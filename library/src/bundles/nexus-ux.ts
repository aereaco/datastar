import { apply, load, setAlias } from '../engine'
import { DELETE } from '../plugins/official/backend/actions/delete'
import { GET } from '../plugins/official/backend/actions/get'
import { PATCH } from '../plugins/official/backend/actions/patch'
import { POST } from '../plugins/official/backend/actions/post'
import { PUT } from '../plugins/official/backend/actions/put'
import { Indicator } from '../plugins/official/backend/attributes/indicator'
import { ExecuteScript } from '../plugins/official/backend/watchers/executeScript'
import { MergeFragments } from '../plugins/official/backend/watchers/mergeFragments'
import { MergeSignals } from '../plugins/official/backend/watchers/mergeSignals'
import { RemoveFragments } from '../plugins/official/backend/watchers/removeFragments'
import { RemoveSignals } from '../plugins/official/backend/watchers/removeSignals'
import { Clipboard } from '../plugins/official/browser/actions/clipboard'
import { CustomValidity } from '../plugins/official/browser/attributes/customValidity'
import { OnIntersect } from '../plugins/official/browser/attributes/onIntersect'
import { OnInterval } from '../plugins/official/browser/attributes/onInterval'
import { OnLoad } from '../plugins/official/browser/attributes/onLoad'
import { OnRaf } from '../plugins/official/browser/attributes/onRaf'
import { OnSignalChange } from '../plugins/official/browser/attributes/onSignalChange'
import { OnSignalPatch } from '../plugins/official/browser/attributes/onSignalPatch'
import { OnResize } from '../plugins/official/browser/attributes/onResize'
import { Persist } from '../plugins/official/browser/attributes/persist'
import { ReplaceUrl } from '../plugins/official/browser/attributes/replaceUrl'
import { ScrollIntoView } from '../plugins/official/browser/attributes/scrollIntoView'
import { ViewTransition } from '../plugins/official/browser/attributes/viewTransition'
import { Component } from '../plugins/official/browser/attributes/component'
import { Effect } from '../plugins/official/browser/attributes/effect'
import { Attr } from '../plugins/official/dom/attributes/attr'
import { Bind } from '../plugins/official/dom/attributes/bind'
import { Class } from '../plugins/official/dom/attributes/class'
import { On } from '../plugins/official/dom/attributes/on'
import { Ref } from '../plugins/official/dom/attributes/ref'
import { Show } from '../plugins/official/dom/attributes/show'
import { Style } from '../plugins/official/dom/attributes/style'
import { Text } from '../plugins/official/dom/attributes/text'
import { JsonSignals } from '../plugins/official/dom/attributes/jsonSignals'
import { PatchElements } from '../plugins/official/backend/watchers/patchElements'
import { PatchSignals } from '../plugins/official/backend/watchers/patchSignals'
import { Peek } from '../plugins/official/logic/actions/peek'
import { Fit } from '../plugins/official/logic/actions/fit'
import { SetAll } from '../plugins/official/logic/actions/setAll'
import { ToggleAll } from '../plugins/official/logic/actions/toggleAll'
import { Router } from '../plugins/official/browser/attributes/router'
import { History } from '../plugins/official/browser/watchers/history'
import { Route } from '../plugins/official/browser/attributes/route'
import { LinkRewriter } from '../plugins/official/browser/watchers/linkRewriter'

load(
  // DOM
  Attr,
  Bind,
  Class,
  On,
  Ref,
  Show,
  Style,
  Text,
  JsonSignals,
  // Backend
  Indicator,
  GET,
  POST,
  PUT,
  PATCH,
  DELETE,
  MergeFragments,
  MergeSignals,
  RemoveFragments,
  RemoveSignals,
  ExecuteScript,
  PatchElements,
  PatchSignals,
  // Browser
  Clipboard,
  CustomValidity,
  OnIntersect,
  OnInterval,
  OnLoad,
  OnRaf,
  OnSignalChange,
  OnSignalPatch,
  OnResize,
  Persist,
  ReplaceUrl,
  ScrollIntoView,
  ViewTransition,
  Router,
  History,
  Route,
  LinkRewriter,
  Component,
  Effect,
  // Logic
  Fit,
  SetAll,
  ToggleAll,
  Peek,
)

apply()

export { apply, load, setAlias }