(ns examples.snippets
  (:require
    [aereaco.nexus-ux.clojure.api :as d*]
    [aereaco.nexus-ux.clojure.adapter.common :refer [on-open]]
    [aereaco.nexus-ux.clojure.adapter.test :as at :refer [->sse-response]]))


;; Snippets used in the website docs

(def sse (at/->sse-gen))

;; multiple_events
(d*/merge-fragment! sse "<div id=\"question\">...</div>")
(d*/merge-fragment! sse "<div id=\"instructions\">...</div>")
(d*/merge-signals! sse "{answer: '...'}")
(d*/merge-signals! sse "{prize: '...'}")

;; setup
#_{:clj-kondo/ignore true}
(comment
  (require
    '[aereaco.nexus-ux.clojure.api :as d*]
    '[aereaco.nexus-ux.clojure.adapter.http-kit :refer [->sse-response on-open]]))


(defn handler [request]
  (->sse-response request
    {on-open
     (fn [sse]
       (d*/merge-fragment! sse
         "<div id=\"question\">What do you put in a toaster?</div>")

       (d*/merge-signals! sse "{response: \"\", answer: 'bread'}"))}))

(comment
  (handler {}))

 ;; multiple_events going deeper
#_{:clj-kondo/ignore true}
(comment
  (require
    '[aereaco.nexus-ux.clojure.api :as d*]
    '[aereaco.nexus-ux.clojure.adapter.http-kit :refer [->sse-response on-open]]))


#_{:clj-kondo/ignore true}
(defn handler [request]
  (->sse-response request
    {on-open
      (fn [sse]
        (d*/merge-fragment! sse "<div id=\"hello\">Hello, world!</div>")
        (d*/merge-signals!  sse "{foo: {bar: 1}}")
        (d*/execute-script! sse "console.log('Success!')"))}))