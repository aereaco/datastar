package main

import (
	"log"
	"time"

	build "github.com/aereaco/nexus-ux/build"
)

func main() {
	start := time.Now()
	log.Print("Nexus-UX built in TS compiler!")
	defer func() {
		log.Printf("Nexus-UX built in %s", time.Since(start))
	}()

	if err := build.Build(); err != nil {
		log.Fatal(err)
	}

}
