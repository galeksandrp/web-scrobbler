'use strict';

Connector.artistSelector = '#title h3';

Connector.trackSelector = '#title p';

Connector.trackArtSelector = '#coverart img';

Connector.isPlaying = () => Util.hasElementClass('#playpause', 'pause');

$('#title').bind('DOMSubtreeModified', Connector.onStateChanged);
