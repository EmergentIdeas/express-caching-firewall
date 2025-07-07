

## Purpose

This code handles http requests. It allows the ability to block bad actors, throttle bad actors, and returned cached results.

It works a lot like Varnish, which is fantastic. If you just need a cache, you should use Varnish. However, what I wanted was a 
general framework which I could use to implement arbitrary request handling strategies.


## End User Request Handling

The lifecycle of an end user http request is this:

1. Data structure creation

A Request for Service object is created which be used to track to the handling of this http request.


2. Pre-check

A set of synchronous functions are run and given a chance to signal that the request should be discarded. This is the fail-fast
stage. Example operations include enforcing an IP blacklist and blocking POST requests to certain paths. This is a place to check
for only the most obvious of conditions.

3. Request Summary Creation

A Request for Service (RFS) is composed of:

- The original http request
- The original request summary
- The backend request summary
- (optionally) The actual backend request
- (optionally) The actual backend response
- The backend response summary
- The original response summary
- The original http response object
- (optionally) A key for the content to be served to the requester


The request summary creation step consists of one or more synchronous or asynchronous function which examine the original http request
and create a request which represents a request for a piece of content as you wish they'd sent it.

For exmample, pages are often requested using search parameters used for social media link tracking. These parameters would make
it impossible to cache the content, because every user has different parameters. Removing them at this stage is possible and helpful
if the analytics tracking is done on the browser (like Google Analytics does).

This is also the place to investigate/decrypt any security cookies or headers prior to an eventual authorization determination.

This is a fantastic place to remove cookies. Remove cookies you say? Yes, if you know that the request url is publically accessable
and won't change based on a users cookies. This is the case for anything in the "public" directory or the "wp-content" directory.
Not removing cookies essentially makes the request uncacheable.

Any information which will be needed later should be added at this time.


4. Identifier Key Generation

A single synchronous function which generates an Identifier Key. The Identier Key is used to determine of something in the cache is
the same thing that's being requested now. The framework code makes no assumptions about the format or this key. It's used purely as
an indexing key. However, key generation should make use of the the URL, cookies, Vary headers, security headers, language request
headers, and any other feature of the request which would change what content is returned to the user.


5. First Authorization

Zero or more synchronous or asynchronous functions which can stop further processing the request. This can be used for checking actual
user credentials, but can also be used for blocking URLs which, at least for the site being proxied, are obviously attacks.

For example, we block any request which contains `.git` or `.bak` as well as about 100 more.

These functions can also be used for analysis of the requests. For example, any IP requesting a `.git` url can be marked for blacklist
or throttling.

First Authorization functions return nothing if the request should proceed or a function which handles the response if it should stop.


6. Backend Assignment

A synchronous function which finds an authoritative source for the content being request. This is probably a backend http server but could be anything.

This may be a really simple algorithm, association a host name to a server. It could be a more complicated round robin, a weighted
assignment based on server size, or a determination made by server load/health/availability.



7. Cache Availability

Determines if a cache entry exists for the request. At this point, we're not trying to determine if we should use it, just if it exists.

If it exists, the RFS has a CacheEntry memberAdded as `cacheEntry`.


8. Cache Validity

If there is a cache entry, determines if it's valid (not expired). This can be a simple time determination, but can also take into
account the health of the content source, potentially deciding to serve expired content until the content source is healthy again.

It is a component responsible setting the `responseStrategy` attribute of the RFS.

Possible values for `responseStrategy` are:

- cached: respond with content from the cache
- cachedAndRequest: serves the cached content but kicks off a request to refresh the content
- requestAndCache: request the content and serve the returned content, caching the content for future use.
- pass: treat as a stand-alone request. Still runs any transforms or cleanup code, but assumes this response is ineligible for
		caching, for whatever reason
- pipe: treat as a stand-alone request. Don't even try to run any of the post processing stuff.


9. Scheduling

A function which places the RFS into one of several queues. Normally request will go into the "immediate fullfillment" queue, to be
processed as soon as resources are available. However, sometimes problematic actors should still be served content, but should not
be allowed to overwhelm the backend server. This is the case with attackers using an IP address which is a gateway for lots of
legitimate traffic. It's also sometimes the case for search engine crawlers that are requesting resources faster than the backend
server can handle.


10. Waiting

Once a request is ready to be fulfilled it is put into a waiting state. It can be waiting for:

- Content from the cache
- Content from the backend server


11. Fulfillment Prep

A response summary is constructed containing appropriate headers including cache expiration headers. A backend response summary
is available.

One set of functions is used for cached and pass requests, a diffrent set for pipe responses. Pipe responses likely just copy headers and information.


12. Content Rewriting

Rewrites the response content for this request in ways specific for this request. General rewiting of the response is done elsewhere.


13. Response

The original response summary is used to set parameters on the original http response object. Content is piped to the response.









