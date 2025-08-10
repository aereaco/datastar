//! [`MergeSignals`] sends one or more signals to the browser to be merged into the signals.

use {
    crate::{StateEvent, consts},
    core::time::Duration,
};

/// [`MergeSignals`] sends one or more signals to the browser to be merged into the signals.
///
/// See the [Nexus-UX documentation](https://nexus.aerea.co/reference/sse_events#state-merge-signals) for more information.
///
/// # Examples
///
///  ```
/// use nexus_ux::prelude::{Sse, MergeSignals};
/// use async_stream::stream;
///
/// Sse(stream! {
///     yield MergeSignals::new("{foo: 1234}")
///         .only_if_missing(true);
/// });
/// ```
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct MergeSignals {
    /// `id` can be used by the backend to replay events.
    /// This is part of the SSE spec and is used to tell the browser how to handle the event.
    /// For more details see <https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#id>
    pub id: Option<String>,
    /// `retry` is part of the SSE spec and is used to tell the browser how long to wait before reconnecting if the connection is lost.
    /// For more details see <https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#retry>
    pub retry: Duration,
    /// `signals` is a JavaScript object or JSON string that will be sent to the browser to update signals in the signals.
    /// The data ***must*** evaluate to a valid JavaScript. It will be converted to signals by the Nexus-UX client side.
    pub signals: String,
    /// Whether to merge the signal only if it does not already exist.
    /// If not provided, the Nexus-UX client side will default to false, which will cause the data to be merged into the signals.
    pub only_if_missing: bool,
}

impl MergeSignals {
    /// Creates a new [`MergeSignals`] event with the given signals.
    pub fn new(signals: impl Into<String>) -> Self {
        Self {
            id: None,
            retry: Duration::from_millis(consts::DEFAULT_SSE_RETRY_DURATION),
            signals: signals.into(),
            only_if_missing: consts::DEFAULT_MERGE_SIGNALS_ONLY_IF_MISSING,
        }
    }

    /// Sets the `id` of the [`MergeSignals`] event.
    pub fn id(mut self, id: impl Into<String>) -> Self {
        self.id = Some(id.into());
        self
    }

    /// Sets the `retry` of the [`MergeSignals`] event.
    pub fn retry(mut self, retry: Duration) -> Self {
        self.retry = retry;
        self
    }

    /// Sets the `only_if_missing` of the [`MergeSignals`] event.
    pub fn only_if_missing(mut self, only_if_missing: bool) -> Self {
        self.only_if_missing = only_if_missing;
        self
    }

    /// Converts this [`MergeSignals`] into a [`StateEvent`].
    #[inline]
    pub fn into_event(self) -> StateEvent {
        self.into()
    }
}

impl From<MergeSignals> for StateEvent {
    fn from(val: MergeSignals) -> Self {
        let mut data: Vec<String> = Vec::new();

        if val.only_if_missing != consts::DEFAULT_MERGE_SIGNALS_ONLY_IF_MISSING {
            data.push(format!(
                "{} {}",
                consts::ONLY_IF_MISSING_DATALINE_LITERAL,
                val.only_if_missing
            ));
        }

        data.push(format!(
            "{} {}",
            consts::SIGNALS_DATALINE_LITERAL,
            val.signals
        ));

        Self {
            event: consts::EventType::MergeSignals,
            id: val.id,
            retry: val.retry,
            data,
        }
    }
}