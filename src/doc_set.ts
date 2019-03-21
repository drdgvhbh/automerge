import { Iterator, Map, Set } from 'immutable';
import Backend = require('../backend');
import Frontend = require('../frontend');

type Doc = Map<any, any>;
type Handler = (docID: string, doc: Doc) => void;

class DocSet {
  public docs: Map<string, Doc>;

  public handlers: Set<Handler>;

  constructor() {
    this.docs = Map<string, Doc>();
    this.handlers = Set();
  }

  public get docIds(): Iterator<string> {
    return this.docs.keys();
  }

  public getDoc(docId: string): Doc {
    return this.docs.get(docId);
  }

  public setDoc(docId: string, doc: Map<any, any>): void {
    this.docs = this.docs.set(docId, doc);
    this.handlers.forEach((handler) => handler!(docId, doc));
  }

  public applyChanges(docId: string, changes: any): Doc {
    let doc =
      this.docs.get(docId) || (Frontend as any).init({ backend: Backend });
    const oldState = (Frontend as any).getBackendState(doc);
    const [newState, patch] = Backend.applyChanges(oldState, changes);
    patch.state = newState;
    doc = (Frontend as any).applyPatch(doc, patch);
    this.setDoc(docId, doc);
    return doc;
  }

  public registerHandler(handler: Handler): void {
    this.handlers = this.handlers.add(handler);
  }

  public unregisterHandler(handler: Handler): void {
    this.handlers = this.handlers.remove(handler);
  }
}

module.exports = DocSet;
