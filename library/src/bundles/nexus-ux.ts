import { apply, load, setAlias } from '../engine'
import { DELETE } from '../modules/backend/actions/delete'
import { GET } from '../modules/backend/actions/get'
import { PATCH } from '../modules/backend/actions/patch'
import { POST } from '../modules/backend/actions/post'
import { PUT } from '../modules/backend/actions/put'
import { Indicator } from '../modules/backend/attributes/indicator'
import { ExecuteScript } from '../modules/backend/watchers/executeScript'
import { MergeFragments } from '../modules/backend/watchers/mergeFragments'
import { MergeSignals } from '../modules/backend/watchers/mergeSignals'
import { RemoveFragments } from '../modules/backend/watchers/removeFragments'
import { RemoveSignals } from '../modules/backend/watchers/removeSignals'
import { Clipboard } from '../modules/browser/actions/clipboard'
import { CustomValidity } from '../modules/browser/attributes/customValidity'
import { OnIntersect } from '../modules/browser/attributes/onIntersect'
import { OnInterval } from '../modules/browser/attributes/onInterval'
import { OnLoad } from '../modules/browser/attributes/onLoad'
import { OnRaf } from '../modules/browser/attributes/onRaf'
import { OnSignalChange } from '../modules/browser/attributes/onSignalChange'
import { OnSignalPatch } from '../modules/browser/attributes/onSignalPatch'
import { OnResize } from '../modules/browser/attributes/onResize'
import { Persist } from '../modules/browser/attributes/persist'
import { ReplaceUrl } from '../modules/browser/attributes/replaceUrl'
import { ScrollIntoView } from '../modules/browser/attributes/scrollIntoView'
import { ViewTransition } from '../modules/browser/attributes/viewTransition'
import { Component } from '../modules/browser/attributes/component'
import { Effect } from '../modules/browser/attributes/effect'
import { Focus } from '../modules/browser/attributes/focus'
import { Id as IdAttribute } from '../modules/browser/attributes/id'
import { Id as IdAction } from '../modules/browser/actions/id'
import { Attr } from '../modules/dom/attributes/attr'
import { Bind } from '../modules/dom/attributes/bind'
import { Class } from '../modules/dom/attributes/class'
import { For } from '../modules/dom/attributes/for'
import { On } from '../modules/dom/attributes/on'
import { Ref } from '../modules/dom/attributes/ref'
import { Show } from '../modules/dom/attributes/show'
import { Sort } from '../modules/dom/attributes/sort'
import { Style } from '../modules/dom/attributes/style'
import { Text } from '../modules/dom/attributes/text'
import { Teleport } from '../modules/dom/attributes/teleport'
import { JsonSignals } from '../modules/dom/attributes/jsonSignals'
import { PatchElements } from '../modules/backend/watchers/patchElements'
import { PatchSignals } from '../modules/backend/watchers/patchSignals'
import { Peek } from '../modules/logic/actions/peek'
import { Fit } from '../modules/logic/actions/fit'
import { SetAll } from '../modules/logic/actions/setAll'
import { ToggleAll } from '../modules/logic/actions/toggleAll'
import { Router } from '../modules/browser/attributes/router'
import { History } from '../modules/browser/watchers/history'
import { Route } from '../modules/browser/attributes/route'
import { LinkRewriter } from '../modules/browser/watchers/linkRewriter'
import { Html } from '../modules/dom/attributes/html'
import { Cloak } from '../modules/dom/attributes/cloak'
import { If } from '../modules/dom/attributes/if'
import { NextTick } from '../modules/browser/actions/nextTick'
import { WebSocketPlugin } from '../modules/browser/attributes/websocket'
import { WebSocketSendAction } from '../modules/logic/actions/websocket'
import { GraphQLPlugin } from '../modules/browser/attributes/graphql'


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