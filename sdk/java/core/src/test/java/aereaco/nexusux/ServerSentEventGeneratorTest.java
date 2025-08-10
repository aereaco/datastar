package aereaco.nexusux;

import aereaco.nexusux.enums.FragmentMergeMode;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ServerSentEventGeneratorTest {

    @Test
    void testMergeFragments() {
        Event event = ServerSentEventGenerator.mergeFragments("<div>Hello</div>", "#container", FragmentMergeMode.Append, true);
        String expected = "event: state-merge-fragments\ndata: selector #container\ndata: mergeMode append\ndata: useViewTransition true\ndata: fragments <div>Hello</div>\n\n";
        assertEquals(expected, event.toString());
    }

    @Test
    void testRemoveFragments() {
        Event event = ServerSentEventGenerator.removeFragments("#item", false);
        String expected = "event: state-remove-fragments\ndata: selector #item\n\n";
        assertEquals(expected, event.toString());
    }

    @Test
    void testMergeSignals() {
        Event event = ServerSentEventGenerator.mergeSignals("{ \"key\": \"value\" }", true);
        String expected = "event: state-merge-signals\ndata: onlyIfMissing true\ndata: signals { \"key\": \"value\" }\n\n";
        assertEquals(expected, event.toString());
    }

    @Test
    void testRemoveSignals() {
        Event event = ServerSentEventGenerator.removeSignals(Arrays.asList("path1", "path2"));
        String expected = "event: state-remove-signals\ndata: paths path1\ndata: paths path2\n\n";
        assertEquals(expected, event.toString());
    }

    @Test
    void testExecuteScript() {
        Event event = ServerSentEventGenerator.executeScript("console.log('test')", false, Collections.singletonList("type text/javascript"));
        String expected = "event: state-execute-script\ndata: autoRemove false\ndata: attributes type text/javascript\ndata: script console.log('test')\n\n";
        assertEquals(expected, event.toString());
    }

    @Test
    void testRedirect() {
        Event event = ServerSentEventGenerator.redirect("/new-location");
        String expected = "event: state-execute-script\ndata: script setTimeout(() => window.location = '/new-location')\n\n";
        assertEquals(expected, event.toString());
    }
}
