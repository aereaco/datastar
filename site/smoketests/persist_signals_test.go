package smoketests

import (
	"testing"

	"github.com/go-rod/rod"
	"github.com/stretchr/testify/assert"
)

func TestPersistSignals(t *testing.T) {
	setupPageTest(t, "tests/persist_signals", func(runner runnerFn) {
		runner("tests/persist_signals", func(t *testing.T, page *rod.Page) {
			page.MustWaitIdle()
			assert.Equal(t, "1", getLocalStoragePath(t, page, "foo"))
			assert.Equal(t, "1", getLocalStoragePath(t, page, "bar"))
			assert.Equal(t, "1", getLocalStoragePath(t, page, "baz"))
		})
	})
}
