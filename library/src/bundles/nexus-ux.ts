import { apply, load, setAlias } from '../engine'
import { DELETE } from '../plugins/backend/actions/delete'
import { GET } from '../plugins/backend/actions/get'
import { PATCH } from '../plugins/backend/actions/patch'
import { POST } from '../plugins/backend/actions/post'
import { PUT } from '../plugins/backend/actions/put'
import { Indicator } from '../plugins/backend/attributes/indicator'
import { ExecuteScript } from '../plugins/backend/watchers/executeScript'
import { MergeFragments } from '../plugins/backend/watchers/mergeFragments'
import { MergeSignals } from '../plugins/backend/watchers/mergeSignals'
import { RemoveFragments } from '../plugins/backend/watchers/removeFragments'
import { RemoveSignals } from '../plugins/backend/watchers/removeSignals'
import { Clipboard } from '../plugins/browser/actions/clipboard'
import { CustomValidity } from '../plugins/browser/attributes/customValidity'
import { OnIntersect } from '../plugins/browser/attributes/onIntersect'
import { OnInterval } from '../plugins/browser/attributes/onInterval'
import { OnLoad } from '../plugins/browser/attributes/onLoad'
import { OnRaf } from '../plugins/browser/attributes/onRaf'
import { OnSignalChange } from '../plugins/browser/attributes/onSignalChange'
import { OnSignalPatch } from '../plugins/browser/attributes/onSignalPatch'
import { OnResize } from '../plugins/browser/attributes/onResize'
import { Persist } from '../plugins/browser/attributes/persist'
import { ReplaceUrl } from '../plugins/browser/attributes/replaceUrl'
import { ScrollIntoView } from '../plugins/browser/attributes/scrollIntoView'
import { ViewTransition } from '../plugins/browser/attributes/viewTransition'
import { Component } from '../plugins/browser/attributes/component'
import { Effect } from '../plugins/browser/attributes/effect'
import { Focus } from '../plugins/browser/attributes/focus'
import { Id as IdAttribute } from '../plugins/browser/attributes/id'
import { Id as IdAction } from '../plugins/browser/actions/id'
import { Attr } from '../plugins/dom/attributes/attr'
import { Bind } from '../plugins/dom/attributes/bind'
import { Class } from '../plugins/dom/attributes/class'
import { For } from '../plugins/dom/attributes/for'
import { On } from '../plugins/dom/attributes/on'
import { Ref } from '../plugins/dom/attributes/ref'
import { Show } from '../plugins/dom/attributes/show'
import { Sort } from '../plugins/dom/attributes/sort'
import { Style } from '../plugins/dom/attributes/style'
import { Text } from '../plugins/dom/attributes/text'
import { Teleport } from '../plugins/dom/attributes/teleport'
import { JsonSignals } from '../plugins/dom/attributes/jsonSignals'
import { PatchElements } from '../plugins/backend/watchers/patchElements'
import { PatchSignals } from '../plugins/backend/watchers/patchSignals'
import { Peek } from '../plugins/logic/actions/peek'
import { Fit } from '../plugins/logic/actions/fit'
import { SetAll } from '../plugins/logic/actions/setAll'
import { ToggleAll } from '../plugins/logic/actions/toggleAll'
import { Router } from '../plugins/browser/attributes/router'
import { History } from '../plugins/browser/watchers/history'
import { Route } from '../plugins/browser/attributes/route'
import { LinkRewriter } from '../plugins/browser/watchers/linkRewriter'
import { Html } from '../plugins/dom/attributes/html'
import { Cloak } from '../plugins/dom/attributes/cloak'
import { If } from '../plugins/dom/attributes/if'
import { NextTick } from '../plugins/browser/actions/nextTick'
import { WebSocketPlugin } from '../plugins/browser/attributes/websocket'
import { WebSocketSendAction } from '../plugins/logic/actions/websocket'
import { GraphQLPlugin } from '../plugins/browser/attributes/graphql'


load(
  // DOM
  Attr,
  Bind,
  Class,
  For,
  On,
  Ref,
  Show,
  Sort,
  Style,
  Text,
  Teleport,
  JsonSignals,
  Html,
  Cloak,
  If,
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
  Focus,
  IdAttribute,
  IdAction,
  NextTick,
  WebSocketPlugin,
  GraphQLPlugin,
  // Logic
  Fit,
  SetAll,
  ToggleAll,
  Peek,
  WebSocketSendAction,
)

apply()

export { apply, load, setAlias }