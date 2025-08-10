(ns examples.common
  (:require
    [dev.onionpancakes.chassis.core :as h]
    [dev.onionpancakes.chassis.compiler :as hc]
    [aereaco.nexus-ux.clojure.consts :as consts]))


(def cdn-url
  (str "https://cdn.jsdelivr.net/gh/aereaco/nexus-ux@"
       consts/version
       "/bundles/nexus-ux.js"))


(defn page-scaffold [body]
  (hc/compile
    [[h/doctype-html5]
     [:html
      [:head
       [:meta {:charset "UTF-8"}]
       [:script {:type "module"
                 :src cdn-url}]]
      [:body body]]]))