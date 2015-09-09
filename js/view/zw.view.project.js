'use strict';

(function ($, Backbone) {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
    var ReactTransitionGroup = React.addons.TransitionGroup;

    /* Control */
    var ZWPageGroup = React.createClass({
        displayName: 'ZWPageGroup',

        getInitialState: function getInitialState() {
            return { items: [] };
        },
        handleAdd: function handleAdd(item) {
            var newItems = this.state.items.concat(item);
            this.setState({ items: newItems });
        },
        handleRemove: function handleRemove(i) {
            var newItems = this.state.items;
            newItems.splice(i, 1);
            this.setState({ items: newItems });
        },
        handleUpdate: function handleUpdate(updateItem) {
            var newItems = this.state.items.map(function (item) {
                return item.key === updateItem.key ? updateItem : item;
            });
            this.setState({ items: newItems });
        },
        componentDidMount: function componentDidMount() {
            ZWPubSub.sub('ZWPageGroup:add', (function (item) {
                this.handleAdd(item);
            }).bind(this));
            ZWPubSub.sub('ZWPageGroup:remove', (function (i) {
                this.handleRemove(i);
            }).bind(this));
            ZWPubSub.sub('ZWPageGroup:update', (function (item) {
                this.handleUpdate(item);
            }).bind(this));
        },
        render: function render() {
            var items = this.state.items.map((function (item, i) {
                return React.createElement(ZWPage, { backLink: item.backLink, key: item.key, display: item.display, showHeader: item.showHeader, headerTitle: item.headerTitle, content: item.content, customClass: item.customClass });
            }).bind(this));
            return React.createElement(
                ReactTransitionGroup,
                { className: 'zw-page-transition', transitionName: 'fly-in' },
                items
            );
        }
    });
    var ZWPage = React.createClass({
        displayName: 'ZWPage',

        getInitialState: function getInitialState() {
            return {};
        },
        back: function back(e) {},
        componentWillUnmount: function componentWillUnmount() {},
        componentWillEnter: function componentWillEnter(callback) {
            var node = $(React.findDOMNode(this));
            node.addClass('fly-in-enter');
            setTimeout(function () {
                node.removeClass('fly-in-enter').addClass('fly-in-enter-active');
            }, 1);
            setTimeout(function () {
                callback();
            }, 200);
        },
        componentDidEnter: function componentDidEnter() {
            var node = $(React.findDOMNode(this));
            node.removeClass('fly-in-enter-active');
        },
        componentWillLeave: function componentWillLeave(callback) {
            var node = $(React.findDOMNode(this));
            node.addClass('fly-in-leave');
            setTimeout(function () {
                node.removeClass('fly-in-leave').addClass('fly-in-leave-active');
            }, 1);
            setTimeout(function () {
                callback();
            }, 200);
        },
        componentDidLeave: function componentDidLeave() {
            ZWPubSub.pub('ZWPage:leave');
        },
        render: function render() {
            var header = this.props.showHeader ? React.createElement(
                'h2',
                { className: this.props.backLink === undefined ? 'zw-first-page-title' : '' },
                this.props.backLink === undefined ? null : React.createElement(
                    'a',
                    { href: this.props.backLink, title: '', className: 'zw-back', onClick: this.back },
                    React.createElement(SVGIconBack, null)
                ),
                React.createElement(ZWTextEllipsis, { text: this.props.headerTitle === undefined ? '' : this.props.headerTitle })
            ) : null;
            return React.createElement(
                'div',
                { key: this.props.key, className: 'zw-page' + (this.props.customClass === undefined ? '' : ' ' + this.props.customClass) },
                header,
                this.props.content
            );
        }
    });
    /* end. Control */

    /* Page */
    var ZWProjectDashboard = React.createClass({
        displayName: 'ZWProjectDashboard',

        init: false,
        dataInterval: undefined,
        loadDataFromServer: function loadDataFromServer() {
            $.ajax({
                url: this.props.url,
                dataType: 'json',
                cache: false,
                success: (function (data) {
                    var data = {
                        key: this.props.id,
                        showHeader: false,
                        headerTitle: '',
                        content: React.createElement(ZWProjectList, { data: data.projects }),
                        customClass: ''
                    };
                    if (!this.init) {
                        this.init = true;
                        ZWPubSub.pub('ZWPageGroup:add', data);
                    } else {
                        //update
                        ZWPubSub.pub('ZWPageGroup:update', data);
                    }
                }).bind(this),
                error: (function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }).bind(this)
            });
        },
        componentDidMount: function componentDidMount() {
            //default call when rendered
            this.loadDataFromServer();
            if (this.props.pollInterval > 0) {
                this.dataInterval = setInterval(this.loadDataFromServer, this.props.pollInterval);
                ZWPubSub.sub('ZWPage:leave', (function () {
                    clearInterval(this.dataInterval);
                }).bind(this));
            }
        },
        render: function render() {
            return React.createElement(
                'div',
                null,
                React.createElement(ZWNavBar, { active: '0' }),
                React.createElement(ZWPageGroup, null)
            );
        }
    });
    var ZWProject = React.createClass({
        displayName: 'ZWProject',

        init: false,
        dataInterval: undefined,
        loadDataFromServer: function loadDataFromServer() {
            $.ajax({
                url: this.props.url,
                dataType: 'json',
                cache: false,
                success: (function (data) {
                    var data = {
                        backLink: this.props.backLink,
                        key: this.props.id,
                        showHeader: true,
                        headerTitle: this.props.name,
                        content: React.createElement(ZWList, { data: data.milestones }),
                        customClass: ''
                    };
                    if (!this.init) {
                        this.init = true;
                        ZWPubSub.pub('ZWPageGroup:add', data);
                    } else {
                        //update
                        ZWPubSub.pub('ZWPageGroup:update', data);
                    }
                }).bind(this),
                error: (function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }).bind(this)
            });
        },
        componentDidMount: function componentDidMount() {
            //default call when rendered
            this.loadDataFromServer();
            if (this.props.pollInterval > 0) {
                this.dataInterval = setInterval(this.loadDataFromServer, this.props.pollInterval);
                ZWPubSub.sub('ZWPage:leave', (function () {
                    clearInterval(this.dataInterval);
                }).bind(this));
            }
        },
        render: function render() {
            return React.createElement(
                'div',
                null,
                React.createElement(ZWNavBar, { active: '0' }),
                React.createElement(ZWPageGroup, null)
            );
        }
    });
    var ZWDeliverableList = React.createClass({
        displayName: 'ZWDeliverableList',

        init: false,
        dataInterval: undefined,
        loadDataFromServer: function loadDataFromServer() {
            $.ajax({
                url: this.props.url,
                dataType: 'json',
                cache: false,
                success: (function (data) {
                    var data = {
                        backLink: this.props.backLink,
                        key: this.props.id,
                        showHeader: true,
                        headerTitle: this.props.name,
                        content: React.createElement(ZWTaskList, { url: this.props.url, pollInterval: this.props.pollInterval }),
                        customClass: ''
                    };
                    if (!this.init) {
                        this.init = true;
                        ZWPubSub.pub('ZWPageGroup:add', data);
                    } else {
                        //update
                        ZWPubSub.pub('ZWPageGroup:update', data);
                    }
                }).bind(this),
                error: (function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }).bind(this)
            });
        },
        componentDidMount: function componentDidMount() {
            //default call when rendered
            this.loadDataFromServer();
            if (this.props.pollInterval > 0) {
                this.dataInterval = setInterval(this.loadDataFromServer, this.props.pollInterval);
                ZWPubSub.sub('ZWPage:leave', (function () {
                    clearInterval(this.dataInterval);
                }).bind(this));
            }
        },
        render: function render() {
            return React.createElement(
                'div',
                null,
                React.createElement(ZWNavBar, { active: '0' }),
                React.createElement(ZWPageGroup, null)
            );
        }
    });
    var ZWTaskList = React.createClass({
        displayName: 'ZWTaskList',

        taskInterval: undefined,
        getInitialState: function getInitialState() {
            return { data: [] };
        },
        loadDataFromServer: function loadDataFromServer() {
            $.ajax({
                url: this.props.url,
                dataType: 'json',
                cache: false,
                success: (function (data) {
                    this.setState({ data: data.tasks });
                }).bind(this),
                error: (function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }).bind(this)
            });
        },
        componentDidMount: function componentDidMount() {
            //default call when rendered
            this.loadDataFromServer();
            if (this.props.pollInterval > 0) {
                this.dataInterval = setInterval(this.loadDataFromServer, this.props.pollInterval);
                ZWPubSub.sub('ZWPage:leave', (function () {
                    clearInterval(this.dataInterval);
                }).bind(this));
            }
        },
        render: function render() {
            var tasks = this.state.data.map(function (taskItem) {
                return React.createElement(
                    'li',
                    { key: taskItem.id },
                    React.createElement(ZWTask, { data: taskItem })
                );
            });

            return React.createElement(
                'ul',
                { className: 'zw-list zw-tasks-list' },
                tasks
            );
        }
    });
    /* end. Page */

    /* Block/Instance */
    var ZWTextEllipsis = React.createClass({
        displayName: 'ZWTextEllipsis',

        render: function render() {
            return React.createElement(
                'span',
                { className: 'zw-text-ellipsis' },
                React.createElement(
                    'em',
                    null,
                    this.props.text
                ),
                React.createElement('a', { href: '#', title: '' })
            );
        }
    });

    var ZWNav = React.createClass({
        displayName: 'ZWNav',

        getInitialState: function getInitialState() {
            return { active: '0' };
        },
        componentDidMount: function componentDidMount() {
            this.setState({ active: this.props.active });
        },
        render: function render() {
            return React.createElement(
                'ul',
                { className: 'zw-main-nav' },
                React.createElement(
                    'li',
                    { className: 'zw-main-nav__item' + (this.state.active === '0' ? ' zw-main-nav__item--active' : '') },
                    React.createElement(
                        'a',
                        { href: '', title: 'Project' },
                        React.createElement(SVGIconProject, null)
                    )
                ),
                React.createElement(
                    'li',
                    { className: 'zw-main-nav__item' + (this.state.active === '1' ? ' zw-main-nav__item--active' : '') },
                    React.createElement(
                        'a',
                        { href: '', title: 'Message' },
                        React.createElement(SVGIconMessage, null)
                    )
                ),
                React.createElement(
                    'li',
                    { className: 'zw-main-nav__item zw-main-nav__item--alt' },
                    React.createElement(
                        'a',
                        { href: '', title: '' },
                        React.createElement(SVGIconAvatar, { image: 'images/avatar.jpg' })
                    )
                )
            );
        }
    });

    var ZWNavBar = React.createClass({
        displayName: 'ZWNavBar',

        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-nav-bar' },
                React.createElement(
                    'h1',
                    null,
                    'zenwork'
                ),
                React.createElement(ZWNav, { active: this.props.active })
            );
        }
    });

    var ZWProjectList = React.createClass({
        displayName: 'ZWProjectList',

        render: function render() {
            var projects = this.props.data.map(function (projectItem) {
                return React.createElement(
                    'li',
                    { key: projectItem.id },
                    React.createElement(
                        'a',
                        { href: '#!m/' + projectItem.id, title: projectItem.name },
                        projectItem.name,
                        ' ',
                        React.createElement(SVGIconNext, null)
                    )
                );
            });
            return React.createElement(
                'ul',
                { id: 'zw-project-list', className: 'zw-project-list' },
                projects
            );
        }
    });

    var ZWList = React.createClass({
        displayName: 'ZWList',

        render: function render() {
            var milestones = this.props.data.map(function (milestoneItem) {
                return React.createElement(
                    'li',
                    { key: milestoneItem.id },
                    React.createElement(ZWMilestone, { data: milestoneItem })
                );
            });
            return React.createElement(
                'ul',
                { id: 'zw-list', className: 'zw-list' },
                milestones
            );
        }
    });

    var ZWMilestone = React.createClass({
        displayName: 'ZWMilestone',

        getInitialState: function getInitialState() {
            return { expand: false };
        },
        handleClick: function handleClick(e) {
            e.preventDefault();

            this.setState({ expand: !this.state.expand });
        },
        render: function render() {
            var deliverables = this.props.data.deliverables.map(function (deliverableItem) {
                return React.createElement(
                    'li',
                    { key: deliverableItem.id },
                    React.createElement(ZWDeliverable, { data: deliverableItem })
                );
            });
            return React.createElement(
                'div',
                { className: 'zw-milestone' },
                React.createElement(
                    'span',
                    { className: 'zw-timeline-date' },
                    ZWUtils.formatDate(this.props.data.dueDate)
                ),
                React.createElement(ZWCheckbox, { data: this.props.data.status }),
                React.createElement(
                    'a',
                    { className: 'zw-item-name', onClick: this.handleClick, href: '#' + this.props.data.id, title: this.props.data.name },
                    this.props.data.name
                ),
                React.createElement(
                    'ul',
                    { className: 'zw-deliverable' + (this.state.expand ? '' : ' hidden') },
                    deliverables
                )
            );
        }
    });

    var ZWDeliverable = React.createClass({
        displayName: 'ZWDeliverable',

        viewAllTasks: function viewAllTasks(e) {
            e.preventDefault();

            ZWPubSub.pub('ZWPage:change', '#!d/' + this.props.data.id);
        },
        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-deliverable' },
                React.createElement(
                    'span',
                    { className: 'zw-timeline-date' },
                    ZWUtils.formatDate(this.props.data.dueDate)
                ),
                React.createElement(ZWCheckbox, { data: this.props.data.status }),
                React.createElement(
                    'a',
                    { onClick: this.viewAllTasks, className: 'zw-item-name', href: '#' + this.props.data.id, title: this.props.data.name },
                    this.props.data.name
                )
            );
        }
    });

    var ZWTask = React.createClass({
        displayName: 'ZWTask',

        getInitialState: function getInitialState() {
            return { expand: false };
        },
        viewTaskDetails: function viewTaskDetails(e) {
            e.preventDefault();

            this.setState({ expand: !this.state.expand });
        },
        updateField: function updateField(e) {
            console.log(e.target.value);
        },
        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-task' },
                React.createElement(
                    'span',
                    { className: 'zw-timeline-date' },
                    ZWUtils.formatDate(this.props.data.dueDate)
                ),
                React.createElement(ZWCheckbox, { data: this.props.data.status }),
                React.createElement(
                    'a',
                    { onClick: this.viewTaskDetails, className: 'zw-item-name', href: '#' + this.props.data.id, title: this.props.data.name },
                    this.props.data.name
                ),
                React.createElement(
                    'div',
                    { className: 'zw-task__details' + (this.state.expand ? '' : ' hidden') },
                    React.createElement(
                        'form',
                        { action: this.props.data.id, method: 'post' },
                        React.createElement(
                            'p',
                            null,
                            React.createElement(
                                'strong',
                                null,
                                'From:'
                            ),
                            ' ',
                            React.createElement('input', { type: 'text', value: ZWUtils.formatDate(this.props.data.from), name: '', id: '', onChange: this.updateField })
                        ),
                        React.createElement(
                            'p',
                            null,
                            React.createElement(
                                'strong',
                                null,
                                'Deadline:'
                            ),
                            ' ',
                            React.createElement('input', { type: 'text', value: ZWUtils.formatDate(this.props.data.dueDate), name: '', id: '', onChange: this.updateField })
                        ),
                        React.createElement(
                            'p',
                            null,
                            React.createElement(
                                'strong',
                                null,
                                'Effort:'
                            ),
                            ' ',
                            React.createElement('input', { type: 'text', value: this.props.data.effort, name: '', id: '', onChange: this.updateField })
                        ),
                        React.createElement(
                            'p',
                            null,
                            React.createElement(
                                'strong',
                                null,
                                'Assign:'
                            ),
                            ' ',
                            React.createElement('input', { type: 'text', value: this.props.data.assign, name: '', id: '', onChange: this.updateField })
                        ),
                        React.createElement(
                            'div',
                            null,
                            React.createElement(
                                'strong',
                                null,
                                'Note:'
                            ),
                            ' ',
                            React.createElement('textarea', { className: '', value: this.props.data.note, onChange: this.updateField })
                        ),
                        React.createElement('hr', null),
                        React.createElement(
                            'div',
                            { className: 'zw-task-comment-box' },
                            React.createElement('textarea', { className: 'zw-task__comment', placeholder: ZWUtils.locale('Write comment here', 'en') }),
                            React.createElement(
                                'button',
                                null,
                                ZWUtils.locale('Post', 'en')
                            )
                        )
                    )
                )
            );
        }
    });

    var ZWCheckbox = React.createClass({
        displayName: 'ZWCheckbox',

        /** status
         *  - 0: not start
         *  - 1: on going
         *  - 2: done
         */
        getInitialState: function getInitialState() {
            return {
                status: 0
            };
        },
        componentDidMount: function componentDidMount() {
            this.setState({ status: this.props.data });
        },
        getSVGIcon: function getSVGIcon() {
            switch (this.state.status) {
                case 0:
                    return React.createElement(SVGIconItemNormal, null);
                    break;
                case 1:
                    return React.createElement(SVGIconOnProgress, null);
                    break;
                case 2:
                    return React.createElement(SVGIconDone, null);
                    break;
            }
        },
        updateStatus: function updateStatus(e) {
            e.preventDefault();

            var nextStatus = this.state.status == 0 ? 1 : this.state.status == 1 ? 2 : 0;
            this.setState({ status: nextStatus });
        },
        render: function render() {
            return React.createElement(
                'a',
                { href: '#', title: '', onClick: this.updateStatus, className: 'zw-item-status zw-item-status--' + this.state.status },
                this.getSVGIcon()
            );
        }
    });
    /* end. Block/Instance */

    //entry
    //Project dashboard view
    ZWPubSub.sub('ZWApp.Project:dashboard', function (data) {
        React.render(React.createElement(ZWProjectDashboard, { id: data.id, url: data.url, pollInterval: data.pollInterval }), document.getElementById('zw-project'));
    });

    //Milestone view
    ZWPubSub.sub('ZWApp.Project:milestone', function (data) {
        React.render(React.createElement(ZWProject, { backLink: '#!/' + data.id, id: data.id, name: data.name, url: data.url, pollInterval: data.pollInterval }), document.getElementById('zw-project'));
    });

    //Deliverable view
    ZWPubSub.sub('ZWApp.Project:deliverable', function (data) {
        React.render(React.createElement(ZWDeliverableList, { backLink: '#!m/' + data.pid, id: data.id, name: data.name, url: data.url, pollInterval: data.pollInterval }), document.getElementById('zw-project'));
    });
})(jQuery, Backbone);