/**
 * by ukhome@gmail.com
 * @copyright by zenwork.me
 */
'use strict';

(function($) {
    var ZWConfig = {
        pollInterval: 0 //interval for 1 minute = 60s * 1000ms
    };
    var ZWRouter = new ( Backbone.Router.extend({
        routes: {
            '!/:query': 'dashboard', // #!/{user id}
            '!m/:query': 'milestone', // #!m/{project id}
            '!d/:query': 'deliverable', // #!d/{deliverable id}
            '!t': 'task' // #t/{task id}
        },

        initialize: function() {
            this.routesHit = 0;
            Backbone.history.on('route', function() { this.routesHit++; }, this);
        },

        dashboard: function(uid) {
            //show projects list
            var data = $.extend( true, {}, ZWConfig, {
                id: uid,
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
                url: 'tasks.json' //url for fetching task with given 'did'
            } );
            ZWPubSub.pub( 'ZWApp.Project:deliverable', data );
        },

        task: function(tid) {
            //show milestones list(project details)
        }
    }) )();

    //start routing
    $(document).ready(function() {
        //pub/sub
        ZWPubSub.sub( 'ZWPage:change', function(path) {
            ZWRouter.navigate( path, { trigger: true } );
        });

        //start history
        Backbone.history.start({
            root: '/zenwork/'
        });
    })
})(jQuery);