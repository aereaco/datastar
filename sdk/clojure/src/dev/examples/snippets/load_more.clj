#_{:clj-kondo/ignore true}
(ns examples.snippets.load-more
  (:require
    [dev.onionpancakes.chassis.core :refer [html]]
    [aereaco.nexus-ux.clojure.api :as d*]
    [aereaco.nexus-ux.clojure.adapter.common :refer [on-open]]
    [aereaco.nexus-ux.clojure.adapter.test :refer [->sse-response]]
    [charred.api :as charred]))


(def ^:private bufSize 1024)
(def read-json-str (charred/parse-json-fn {:async? false :bufsize bufSize}))

(def write-json-str charred/write-json-str)



#_{:clj-kondo/ignore true}
(comment
  (require
    '[charred.api :as charred]
    '[aereaco.nexus-ux.clojure.api :as d*]
    '[aereaco.nexus-ux.clojure.adapter.http-kit :refer [->sse-response on-open]]
    '[some.hiccup.library :refer [html]]
    '[some.json.library :refer [read-json-str write-json-str]]))


(def max-offset 5)

(defn handler [ring-request]
  (->sse-response ring-request
    {on-open
     (fn [sse]
       (let [d*-signals (-> ring-request d*/get-signals read-json-str)
             offset (get d*-signals "offset")
             limit 1
             new-offset (+ offset limit)]

         (d*/merge-fragment! sse
                             (html [:div "Item " new-offset])
                             {d*/selector   "#list"
                              d*/merge-mode d*/mm-append})

         (if (< new-offset max-offset)
           (d*/merge-signals! sse (write-json-str {"offset" new-offset}))
           (d*/remove-fragment! sse "#load-more"))

         (d*/close-sse! sse)))}))


(comment
  (handler {:request-method :get :query-params {"state" "{\"offset\": 1}"}}) 
  (handler {:request-method :get :query-params {"state" "{\"offset\": 2}"}}) 
  (handler {:request-method :get :query-params {"state" "{\"offset\": 3}"}}) 
  (handler {:request-method :get :query-params {"state" "{\"offset\": 4}"}}))