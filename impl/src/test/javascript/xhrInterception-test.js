/*
 * JBoss, Home of Professional Open Source
 * Copyright 2013, Red Hat, Inc. and individual contributors
 * by the @authors tag. See the copyright.txt in the distribution for a
 * full listing of individual contributors.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */
module("XHR Interception");

(function() {

    var inj = Graphene.xhrInterception;
    var originalXhr = window.XMLHttpRequest;

    QUnit.testStart = function() {
        window.XMLHttpRequest = originalXhr;
        inj.uninstall();
    };

    function replaceXHRPrototype(methods) {
        var instances = [];
        var Replacement = function() {
            instances.push(this);
        };
        Replacement.prototype = methods;
        window.XMLHttpRequest = Replacement;
        return instances;
    }
    
    // TESTS
    
    test("accessor object not null", function() {
        ok(inj);
    });

    test("test injection", function() {
        // given
        ok(inj.install);
        var backup = window.XMLHttpRequest;

        // when
        inj.install();

        // then
        notStrictEqual(window.XMLHttpRequest, backup);
        ok(window.XMLHttpRequest);
        ok(window.XMLHttpRequest.prototype.abort);
    });

    test("test initial values", function() {
        // given
        ok(inj.install);
        var backup = window.XMLHttpRequest;

        // when
        inj.install();

        // then
        var xhr = new window.XMLHttpRequest();
        equal(xhr.readyState, 0);
        equal(xhr.response, "");
        equal(xhr.responseText, "");
        equal(xhr.responseType, "");
        equal(xhr.responseXML, null);
        equal(xhr.status, 0);
        equal(xhr.statusText, "");
    });

    test("test xhr wrapper delegation (for abort)", function() {
        // given
        var aborted = false;
        replaceXHRPrototype({
            abort : function() {
                aborted = true;
            }
        });

        // when
        inj.install();
        var xhr = new window.XMLHttpRequest();
        xhr.abort();

        // then
        ok(aborted);
    });

    test("test xhr interception (for abort)", function() {
        // given
        var abortInvoked = false;
        var interceptor1Started = false;
        var interceptor2Started = false;
        var interceptor1Finished = false;
        var interceptor2Finished = false;

        replaceXHRPrototype({
            abort : function() {
                abortInvoked = true;
                return "returnValue";
            }
        });

        // interceptor 1
        inj.onAbort(function(ctx, args) {
            interceptor1Started = true;

            ok(!abortInvoked);
            ok(!interceptor2Started);
            ok(!interceptor2Finished);

            var result = ctx.proceed(args);

            ok(abortInvoked);
            ok(interceptor2Started);
            ok(interceptor2Finished);

            interceptor1Finished = true;
            return result;
        });
        // interceptor 2
        inj.onAbort(function(ctx, args) {
            interceptor2Started = true;

            ok(!abortInvoked);
            ok(interceptor1Started);
            ok(!interceptor1Finished);

            var result = ctx.proceed(args);

            ok(abortInvoked);
            ok(interceptor1Started);
            ok(!interceptor1Finished);

            interceptor2Finished = true;

            return result;
        });

        // when
        inj.install();
        var xhr = new window.XMLHttpRequest();
        xhr.abort();

        // then
        ok(abortInvoked);
        ok(interceptor1Finished);
        ok(interceptor2Finished);
    });

    test("test xhr wrapper delegation (for onreadystatechange)", function() {
        // given
        var statechanged = false;
        var instances = replaceXHRPrototype();

        // when
        inj.install();
        var xhr = new window.XMLHttpRequest();
        xhr.onreadystatechange = function() {
            statechanged = true;
        }
        ok(instances[0]);
        instances[0].onreadystatechange();

        // then
        ok(statechanged);
    });

    test("test xhr interception (for onreadystatechange)", function() {
        // given
        var statechanged = false;
        var interceptor1Started = false;
        var interceptor2Started = false;
        var interceptor1Finished = false;
        var interceptor2Finished = false;

        var instances = replaceXHRPrototype();

        // interceptor 1
        inj.onreadystatechange(function(ctx, args) {
            interceptor1Started = true;

            ok(!statechanged);
            ok(!interceptor2Started);
            ok(!interceptor2Finished);

            var result = ctx.proceed(args);

            ok(statechanged);
            ok(interceptor2Started);
            ok(interceptor2Finished);

            interceptor1Finished = true;
            return result;
        });
        // interceptor 2
        inj.onreadystatechange(function(ctx, args) {
            interceptor2Started = true;

            ok(!statechanged);
            ok(interceptor1Started);
            ok(!interceptor1Finished);

            var result = ctx.proceed(args);

            ok(statechanged);
            ok(interceptor1Started);
            ok(!interceptor1Finished);

            interceptor2Finished = true;

            return result;
        });

        // when
        inj.install();
        var xhr = new window.XMLHttpRequest();
        xhr.onreadystatechange = function() {
            statechanged = true;
        }
        ok(instances[0]);
        instances[0].onreadystatechange();

        // then
        ok(statechanged);
        ok(interceptor1Finished);
        ok(interceptor2Finished);
    });

    test("test readystatechange", function() {
        // given
        var readyState = 0;
        var instances = replaceXHRPrototype();

        // when
        inj.install();
        var xhr = new window.XMLHttpRequest();

        var instance = instances[0];
        ok(instance);

        xhr.onreadystatechange = function(request) {
            ok(request.readyState == readyState);
            if (readyState < 4) {
                equal(request.responseText, undefined);
                equal(request.responseXML, undefined);
                equal(request.status, undefined);
                equal(request.statusText, undefined);
            } else {
                equal(request.responseText, "responseText")
                equal(request.responseXML, "responseXML")
                equal(request.status, 200)
                equal(request.statusText, "statusText")
            }
            readyState += 1;
        }

        instance.readyState = 0;
        instance.onreadystatechange();

        instance.readyState = 1;
        instance.onreadystatechange();

        instance.readyState = 2;
        instance.onreadystatechange();

        instance.readyState = 3;
        instance.onreadystatechange();

        instance.readyState = 4;
        instance.responseText = "responseText";
        instance.responseXML = "responseXML";
        instance.status = 200;
        instance.statusText = "statusText";
        instance.onreadystatechange();

        // then
        equal(readyState, 5);
    })
})();