import transit from 'transit-immutable-js';
import * as Backend from '../backend';
import * as Frontend from '../frontend';
import {
  canRedo,
  canUndo,
  Counter,
  getActorId,
  getConflicts,
  getObjectById,
  getObjectId,
  setActorId,
  Table,
  Text,
} from '../frontend';
import uuid from './uuid';
const { isObject } = require('./common');
import Connection from './connection';
import DocSet from './doc_set';
import WatchableDoc from './watchable_doc';

/**
 * Constructs a new frontend document that reflects the given list of changes.
 */
function docFromChanges(actorId, changes) {
  if (!actorId) {
    throw new RangeError('actorId is required in docFromChanges');
  }
  const doc = Frontend.init({ actorId, backend: Backend });
  const [state] = Backend.applyChanges(Backend.init(), changes);
  const patch = Backend.getPatch(state);
  (patch as any).state = state;
  return Frontend.applyPatch(doc, patch);
}

///// Automerge.* API

function init(actorId) {
  return Frontend.init({ actorId, backend: Backend });
}

function change(doc, message, callback) {
  const [newDoc] = Frontend.change(doc, message, callback);
  return newDoc;
}

function emptyChange(doc, message) {
  const [newDoc] = Frontend.emptyChange(doc, message);
  return newDoc;
}

function undo(doc, message) {
  const [newDoc] = Frontend.undo(doc, message);
  return newDoc;
}

function redo(doc, message) {
  const [newDoc] = Frontend.redo(doc, message);
  return newDoc;
}

function load(string, actorId) {
  return docFromChanges(actorId || uuid(), transit.fromJSON(string));
}

function save(doc) {
  const state = Frontend.getBackendState(doc);
  return transit.toJSON(state.getIn(['opSet', 'history']));
}

function merge(localDoc, remoteDoc) {
  if (Frontend.getActorId(localDoc) === Frontend.getActorId(remoteDoc)) {
    throw new RangeError('Cannot merge an actor with itself');
  }
  const localState = Frontend.getBackendState(localDoc);
  const remoteState = Frontend.getBackendState(remoteDoc);
  const [state, patch] = Backend.merge(localState, remoteState);
  if (patch.diffs.length === 0) {
    return localDoc;
  }
  patch.state = state;
  return Frontend.applyPatch(localDoc, patch);
}

function diff(oldDoc, newDoc) {
  const oldState = Frontend.getBackendState(oldDoc);
  const newState = Frontend.getBackendState(newDoc);
  const changes = Backend.getChanges(oldState, newState);
  const [, patch] = Backend.applyChanges(oldState, changes);
  return patch.diffs;
}

function getChanges(oldDoc, newDoc) {
  const oldState = Frontend.getBackendState(oldDoc);
  const newState = Frontend.getBackendState(newDoc);
  return Backend.getChanges(oldState, newState);
}

function applyChanges(doc, changes) {
  const oldState = Frontend.getBackendState(doc);
  const [newState, patch] = Backend.applyChanges(oldState, changes);
  patch.state = newState;
  return Frontend.applyPatch(doc, patch);
}

function getMissingDeps(doc) {
  return Backend.getMissingDeps(Frontend.getBackendState(doc));
}

function equals(val1, val2) {
  if (!isObject(val1) || !isObject(val2)) {
    return val1 === val2;
  }
  const keys1 = Object.keys(val1).sort(),
    keys2 = Object.keys(val2).sort();
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) {
      return false;
    }
    if (!equals(val1[keys1[i]], val2[keys2[i]])) {
      return false;
    }
  }
  return true;
}

function getHistory(doc) {
  const state = Frontend.getBackendState(doc);
  const actor = Frontend.getActorId(doc);
  const history = state.getIn(['opSet', 'history']);
  return history
    .map((change, index) => {
      return {
        get change() {
          return change.toJS();
        },
        get snapshot() {
          return docFromChanges(actor, history.slice(0, index + 1));
        },
      };
    })
    .toArray();
}

export {
  init,
  change,
  emptyChange,
  undo,
  redo,
  load,
  save,
  merge,
  diff,
  getChanges,
  applyChanges,
  getMissingDeps,
  equals,
  getHistory,
  uuid,
  Frontend,
  Backend,
  DocSet,
  WatchableDoc,
  Connection,
  canRedo,
  canUndo,
  Counter,
  getActorId,
  getConflicts,
  getObjectById,
  getObjectId,
  setActorId,
  Table,
  Text,
};
