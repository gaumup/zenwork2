/**
 * by ukhome@gmail.com
 * @copyright by zenwork.me
 */
'use strict';

(function($) {
    var ZWConfig = {
        pollInterval: 60000 //interval for 1 minute = 60s * 1000ms
    };
    var ZWRouter = new ( Backbone.Router.extend({
        routes: {
            '': 'dashboard', // show projects list dashboard
            '!': 'dashboard', // show projects list dashboard
            '!m/:query': 'milestone', // #!m/{project id}, show project's milestones list
            '!d/:query': 'deliverable', // #!d/{deliverable id}, show milestone's deliverables
            '!t': 'task', // #t/{task id}, show task details
            '!mc': 'message', // #!mc, show message center page
            '!p': 'people' // #!p, show contact people page
        },

        initialize: function() {
            this.routesHit = 0;
            Backbone.history.on('route', function() { this.routesHit++; }, this);
        },
        /* @override
         * - perform custom action before apply routing
         */
        execute: function(callback, args) {
            ZWPubSub.pub( 'ZWPage:leave' );

            //do the routing
            if ( callback ) { callback.apply( this, args ) };
        },

        dashboard: function() {
            //show projects list
            var data = $.extend( true, {}, ZWConfig, {
                id: 'zenwork.dashboard',
                url: 'projects.json'
            } );
            ZWPubSub.pub( 'ZWApp.Project:dashboard', data );
        },

        milestone: function(pid) {
            //show milestones list(project details)
            //do some model fetching project information with given 'pid'
            var data = $.extend( true, {}, ZWConfig, {
                id: pid,
                name: 'Build zenwork app - Simple project management app',
                from: '01-03-2015',
                pm: 'KhoaNT',
                note: 'Note from project',
                url: 'data.json' //url for fetching milestones/deliverables with given 'pid'
            } );
            ZWPubSub.pub( 'ZWApp.Project:milestone', data );
        },

        deliverable: function(did) {
            //show deliverable list(deliverables details)
            //do some model fetching deliverable information with given 'did'
            var data = $.extend( true, {}, ZWConfig, {
                pid: 'P-123',
                id: did,
                name: 'Delivery 1: Finished wireframe for master page',
                dueDate: '04-09-2015',
                effort: '4 days',
                status: 2,
                note: 'This is note for delivery',
                url: 'tasks.json' //url for fetching task with given 'did'
            } );
            ZWPubSub.pub( 'ZWApp.Project:deliverable', data );
        },

        task: function(tid) {
            //show tasks details
        },

        message: function() {
            var data = $.extend( true, {}, ZWConfig, {
                id: 'zenwork.message',
                url: 'chat.json'
            } );
            ZWPubSub.pub( 'ZWApp.Message:app', data );
        },

        people: function() {
            var data = $.extend( true, {}, ZWConfig, {
                id: 'zenwork.people',
                url: 'people.json'
            } );
            ZWPubSub.pub( 'ZWApp.People:app', data );
        }
    }) )();

    //start routing
    $(document).ready(function() {
        //fix 300ms delay on mobile 'click'
        FastClick.attach(document.body);

        //start history
        Backbone.history.start({
            root: '/zenwork/'
        });
    })
})(jQuery);