(ns aereaco.nexus-ux.clojure.adapter.test
  (:require
    [aereaco.nexus-ux.clojure.adapter.common :as ac]
    [aereaco.nexus-ux.clojure.api.sse :as sse]
    [aereaco.nexus-ux.clojure.protocols :as p]
    [aereaco.nexus-ux.clojure.utils :as u])
 (:import
    [java.util.concurrent.locks ReentrantLock]
    [java.io Closeable]))



(deftype ReturnMsgGen []
  p/SSEGenerator
  (send-event! [_ event-type data-lines opts]
    (-> (StringBuilder.)
        (sse/write-event! event-type data-lines opts)
        str))

  (get-lock [_])

  (close-sse! [_])
  (sse-gen? [_] true))



(defn ->sse-gen [& _]
  (->ReturnMsgGen))




(deftype RecordMsgGen [lock !rec !open?]
  p/SSEGenerator
  (send-event! [_ event-type data-lines opts]
    (u/lock! lock
      (vswap! !rec conj (-> (StringBuilder.)
                            (sse/write-event! event-type data-lines opts)
                            str))))

  (get-lock [_] lock)

  (close-sse! [_]
    (u/lock! lock
      (vreset! !open? false)))

  (sse-gen? [_] true)

  Closeable
  (close [this]
    (p/close-sse! this)))


(defn ->sse-response
  "Fake a sse-response, the events sent with sse-gen during the
  `on-open` callback are recorded in a vector stored in an atom returned as the
  body of the response."
  [req {on-open ac/on-open
        :keys [status headers]}]
  (let [
        !rec (volatile! [])
        sse-gen (->RecordMsgGen (ReentrantLock.)
                                !rec
                                (volatile! true))]
    (on-open sse-gen)
    {:status (or status 200)
     :headers (merge headers (sse/headers req))
     :body !rec}))