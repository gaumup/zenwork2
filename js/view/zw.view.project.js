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
        handleLoading: function handleLoading() {
            var node = $(React.findDOMNode(this));
            setTimeout(function () {
                node.addClass('zw-page-loading');
            }, 1);
        },
        handleLoaded: function handleLoaded() {
            var node = $(React.findDOMNode(this));
            node.removeClass('zw-page-loading');
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
            ZWPubSub.sub('ZWPageGroup:pageLoading', (function () {
                this.handleLoading();
            }).bind(this));
            ZWPubSub.sub('ZWPageGroup:pageLoaded', (function () {
                this.handleLoaded();
            }).bind(this));
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
                return React.createElement(ZWPage, { backLink: item.backLink, key: item.key, display: item.display, showHeader: item.showHeader, headerTitle: item.headerTitle, content: item.content, customClass: item.customClass, expandContent: item.expandContent });
            }).bind(this));
            return React.createElement(
                ReactTransitionGroup,
                { className: 'zw-page-transition', transitionName: 'fly-in' },
                React.createElement(
                    'div',
                    { className: 'zw-spin' },
                    React.createElement(SVGIconLoading, null)
                ),
                items
            );
        }
    });
    var ZWPage = React.createClass({
        displayName: 'ZWPage',

        loadingInterval: undefined,
        getInitialState: function getInitialState() {
            return { expandContent: false };
        },
        componentWillEnter: function componentWillEnter(callback) {
            setTimeout(function () {
                ZWPubSub.pub('ZWPageGroup:pageLoaded');
                callback();
            }, 200);
        },
        componentDidEnter: function componentDidEnter() {
            var node = $(React.findDOMNode(this));
            node.addClass('fly-in-enter');

            //binding waves effect when click on link
            node.find('.zw-waves').on('click', function (e) {
                e.preventDefault();

                var $this = $(this);
                $this.addClass('zw-waves--clicked');
                setTimeout(function () {
                    $this.removeClass('zw-waves--clicked');
                    var href = $this.attr('href');
                    if (href !== '' && href !== '#') {
                        window.location = href;
                    }
                }, 200);
            });

            //listen for events
            ZWPubSub.sub('ZWTextEllipsis:toggle', (function (e) {
                this.setState({ expandContent: !this.state.expandContent });
            }).bind(this));
        },
        render: function render() {
            var header = this.props.showHeader ? React.createElement(
                'h2',
                { className: this.props.backLink === undefined ? 'zw-first-page-title' : '' },
                this.props.backLink === undefined ? null : React.createElement(
                    'a',
                    { href: this.props.backLink, title: '', className: 'zw-back' },
                    React.createElement(SVGIconBack, null)
                ),
                React.createElement(ZWTextEllipsis, { text: this.props.headerTitle === undefined ? '' : this.props.headerTitle })
            ) : null;
            var expandContent = this.state.expandContent ? this.props.expandContent : null;
            return React.createElement(
                'div',
                { key: this.props.key, className: 'zw-page' + (this.props.customClass === undefined ? '' : ' ' + this.props.customClass) },
                header,
                React.createElement(
                    'div',
                    { className: 'zw-page-content-dissolve' + (this.state.expandContent ? ' zw-page-content-dissolve--out' : '') },
                    expandContent
                ),
                React.createElement(
                    'div',
                    { className: 'zw-page-content-slide-fade' + (this.state.expandContent ? ' zw-page-content-slide-fade--down' : '') },
                    this.props.content
                )
            );
        }
    });
    /* end. Control */

    /* Page */
    var ZWMasterPage = React.createClass({
        displayName: 'ZWMasterPage',

        init: false,
        dataInterval: undefined,
        request: undefined,
        loadDataFromServer: function loadDataFromServer() {
            this.request = $.ajax({
                url: this.props.data.url,
                dataType: 'json',
                cache: false,
                success: (function (response) {
                    var data = this.props.dataProcess.call(null, response);
                    if (!this.init) {
                        this.init = true;
                        ZWPubSub.pub('ZWPageGroup:add', data);
                    } else {
                        //update
                        ZWPubSub.pub('ZWPageGroup:update', data);
                    }
                }).bind(this),
                error: (function (xhr, status, err) {
                    ZWThrow(xhr, status, err);
                }).bind(this)
            });
        },
        componentDidMount: function componentDidMount() {
            //default call when rendered
            ZWPubSub.pub('ZWPageGroup:pageLoading');
            this.loadDataFromServer();
            ZWPubSub.sub('ZWPage:leave', (function () {
                if (this.request !== undefined) {
                    this.request.abort();
                }

                if (this.dataInterval !== undefined) {
                    clearInterval(this.dataInterval);
                }
            }).bind(this));
            if (this.props.data.pollInterval > 0) {
                this.dataInterval = setInterval(this.loadDataFromServer, this.props.data.pollInterval);
            }
        },
        render: function render() {
            return React.createElement(
                'div',
                null,
                React.createElement(ZWTopBar, null),
                React.createElement(ZWPageGroup, null),
                React.createElement(ZWNavBar, { active: this.props.active })
            );
        }
    });
    var ZWProjectDashboardPage = React.createClass({
        displayName: 'ZWProjectDashboardPage',

        dataProcess: function dataProcess(response) {
            return {
                key: this.props.data.id,
                showHeader: false,
                headerTitle: '',
                content: React.createElement(ZWProjectList, { data: response.projects }),
                customClass: ''
            };
        },
        render: function render() {
            return React.createElement(ZWMasterPage, { active: '0', data: this.props.data, dataProcess: this.dataProcess });
        }
    });
    var ZWMilestonePage = React.createClass({
        displayName: 'ZWMilestonePage',

        dataProcess: function dataProcess(response) {
            var projectData = {
                id: this.props.data.id,
                from: this.props.data.from,
                name: this.props.data.name,
                pm: this.props.data.pm,
                note: this.props.data.note
            };
            return {
                backLink: this.props.backLink,
                key: this.props.data.id,
                showHeader: true,
                headerTitle: this.props.data.name,
                content: React.createElement(ZWList, { data: response.milestones }),
                expandContent: React.createElement(ZWProjectInfo, { data: projectData }),
                customClass: ''
            };
        },
        render: function render() {
            return React.createElement(ZWMasterPage, { active: '0', data: this.props.data, dataProcess: this.dataProcess });
        }
    });
    var ZWDeliverablePage = React.createClass({
        displayName: 'ZWDeliverablePage',

        dataProcess: function dataProcess(response) {
            var deliverableData = {
                id: this.props.data.id,
                dueDate: this.props.data.dueDate,
                name: this.props.data.name,
                effort: this.props.data.effort,
                note: this.props.data.note
            };
            return {
                backLink: this.props.backLink,
                key: this.props.data.id,
                showHeader: true,
                headerTitle: this.props.data.name,
                content: React.createElement(ZWTaskList, { data: response.tasks }),
                expandContent: React.createElement(ZWDeliverableInfo, { data: deliverableData }),
                customClass: ''
            };
        },
        render: function render() {
            return React.createElement(ZWMasterPage, { active: '0', data: this.props.data, dataProcess: this.dataProcess });
        }
    });
    var ZWMessagePage = React.createClass({
        displayName: 'ZWMessagePage',

        dataProcess: function dataProcess(response) {
            return {
                key: this.props.data.id,
                showHeader: false,
                content: React.createElement(ZWMessage, { data: response })
            };
        },
        render: function render() {
            return React.createElement(ZWMasterPage, { active: '1', data: this.props.data, dataProcess: this.dataProcess });
        }
    });
    var ZWPeoplePage = React.createClass({
        displayName: 'ZWPeoplePage',

        dataProcess: function dataProcess(response) {
            return {
                key: this.props.data.id,
                showHeader: false,
                content: React.createElement(ZWPeople, { data: response })
            };
        },
        render: function render() {
            return React.createElement(ZWMasterPage, { active: '2', data: this.props.data, dataProcess: this.dataProcess });
        }
    });
    /* end. Page */

    /* Block/Instance */
    var ZWMessage = React.createClass({
        displayName: 'ZWMessage',

        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-message-app' },
                React.createElement(SVGIconMessage, null),
                React.createElement(
                    'p',
                    null,
                    ZWUtils.locale('Comming soon', 'us')
                )
            );
        }
    });

    var ZWPeople = React.createClass({
        displayName: 'ZWPeople',

        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-people-app' },
                React.createElement(SVGIconPeople, null),
                React.createElement(
                    'p',
                    null,
                    ZWUtils.locale('Comming soon', 'us')
                )
            );
        }
    });

    var ZWTextEllipsis = React.createClass({
        displayName: 'ZWTextEllipsis',

        getInitialState: function getInitialState() {
            return { expand: false };
        },
        handleClick: function handleClick(e) {
            e.preventDefault();

            this.setState({ expand: !this.state.expand });
            ZWPubSub.pub('ZWTextEllipsis:toggle');
        },
        render: function render() {
            return React.createElement(
                'span',
                { className: 'zw-text-ellipsis' },
                React.createElement(
                    'em',
                    null,
                    this.props.text
                ),
                React.createElement('a', { href: '#', title: '', onClick: this.handleClick, className: this.state.expand ? 'active' : '' })
            );
        }
    });

    var ZWTimelineDate = React.createClass({
        displayName: 'ZWTimelineDate',

        render: function render() {
            var date = this.props.date.split('-');
            return React.createElement(
                'span',
                { className: 'zw-timeline-date' },
                React.createElement(
                    'strong',
                    null,
                    date[0]
                ),
                React.createElement('br', null),
                date[1]
            );
        }
    });

    var ZWNavBar = React.createClass({
        displayName: 'ZWNavBar',

        handleClick: function handleClick(e) {
            e.preventDefault();
        },
        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-nav-bar' },
                React.createElement(ZWNav, { active: this.props.active }),
                React.createElement(
                    'a',
                    { href: '', title: '', onClick: this.handleClick, className: 'zw-add-btn' },
                    React.createElement(SVGIconAdd, null)
                )
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
                        { href: '#!', title: 'Project' },
                        React.createElement(SVGIconProject, null)
                    )
                ),
                React.createElement(
                    'li',
                    { className: 'zw-main-nav__item' + (this.state.active === '1' ? ' zw-main-nav__item--active' : '') },
                    React.createElement(
                        'a',
                        { href: '#!mc', title: 'Message' },
                        React.createElement(SVGIconMessage, null)
                    )
                ),
                React.createElement(
                    'li',
                    { className: 'zw-main-nav__item' + (this.state.active === '2' ? ' zw-main-nav__item--active' : '') },
                    React.createElement(
                        'a',
                        { href: '#!p', title: 'People' },
                        React.createElement(SVGIconPeople, null)
                    )
                )
            );
        }
    });

    var ZWTopBar = React.createClass({
        displayName: 'ZWTopBar',

        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-top-bar' },
                React.createElement(
                    'h1',
                    null,
                    'zenwork'
                ),
                React.createElement(ZWSearchBar, null),
                React.createElement(
                    'a',
                    { className: 'zw-avatar-wrapper', href: '#!', title: '' },
                    React.createElement(SVGIconAvatar, { image: 'images/avatar.jpg' })
                )
            );
        }
    });

    var ZWSearchBar = React.createClass({
        displayName: 'ZWSearchBar',

        handleSubmit: function handleSubmit(e) {
            e.preventDefault();
        },
        handleFocus: function handleFocus(e) {},
        handleBlur: function handleBlur(e) {},
        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-search-bar' },
                React.createElement(
                    'form',
                    { action: '', method: 'post', onSubmit: this.handleSubmit },
                    React.createElement(ZWFormRow, { fieldType: 'text', fieldName: 'zw-field-search', fieldId: 'zw-field-search', placeholder: 'Search', focusHandler: this.handleFocus, blurHandler: this.handleBlur }),
                    React.createElement(
                        'div',
                        { className: 'zw-img-btn zw-search-submit' },
                        React.createElement('button', { type: 'submit' }),
                        React.createElement(SVGIconSearch, null)
                    )
                )
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
                        { href: '#!m/' + projectItem.id, title: projectItem.name, className: 'zw-waves' },
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

    var ZWProjectInfo = React.createClass({
        displayName: 'ZWProjectInfo',

        render: function render() {
            return React.createElement(
                'form',
                { action: '', method: 'post' },
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-project-name--' + this.props.data.id, labelName: 'Name', fieldType: 'textarea', fieldValue: this.props.data.name, fieldName: 'zw-field-project-name', fieldId: 'zw-field-project-name--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-project-from--' + this.props.data.id, labelName: 'From', fieldType: 'text', fieldValue: ZWUtils.formatDateFull(this.props.data.from), fieldName: 'zw-field-project-from', fieldId: 'zw-field-project-from--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-project-pm--' + this.props.data.id, labelName: 'PM', fieldType: 'text', fieldValue: this.props.data.pm, fieldName: 'zw-field-project-pm', fieldId: 'zw-field-project-pm--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-project-note--' + this.props.data.id, labelName: 'Note', fieldType: 'textarea', fieldValue: this.props.data.note, fieldName: 'zw-field-project-note', fieldId: 'zw-field-project-note--' + this.props.data.id, placeholder: this.props.data.note === '' ? ZWUtils.locale('Insert note', 'en') : this.props.data.note })
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
                React.createElement(ZWTimelineDate, { date: ZWUtils.formatDate(this.props.data.dueDate) }),
                React.createElement(ZWCheckbox, { data: this.props.data.status }),
                React.createElement(
                    'a',
                    { className: 'zw-item-name zw-waves', onClick: this.handleClick, href: '', title: this.props.data.name },
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

        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-deliverable' },
                React.createElement(ZWTimelineDate, { date: ZWUtils.formatDate(this.props.data.dueDate) }),
                React.createElement(ZWCheckbox, { data: this.props.data.status }),
                React.createElement(
                    'a',
                    { className: 'zw-item-name zw-waves', href: '#!d/' + this.props.data.id, title: this.props.data.name },
                    this.props.data.name
                )
            );
        }
    });

    var ZWDeliverableInfo = React.createClass({
        displayName: 'ZWDeliverableInfo',

        render: function render() {
            return React.createElement(
                'form',
                { action: '', method: 'post' },
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-deliverable-name--' + this.props.data.id, labelName: 'Name', fieldType: 'textarea', fieldValue: this.props.data.name, fieldName: 'zw-field-deliverable-name', fieldId: 'zw-field-deliverable-name--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-deliverable-due--' + this.props.data.id, labelName: 'Due date', fieldType: 'text', fieldValue: ZWUtils.formatDateFull(this.props.data.dueDate), fieldName: 'zw-field-deliverable-due', fieldId: 'zw-field-deliverable-due--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-deliverable-effort--' + this.props.data.effort, labelName: 'Effort', fieldType: 'text', fieldValue: this.props.data.effort, fieldName: 'zw-field-deliverable-effort', fieldId: 'zw-field-deliverable-effort--' + this.props.data.id }),
                React.createElement(ZWFormRow, { labelTarget: 'zw-field-deliverable-note--' + this.props.data.id, labelName: 'Note', fieldType: 'textarea', fieldValue: this.props.data.note, fieldName: 'zw-field-deliverable-note', fieldId: 'zw-field-deliverable-note--' + this.props.data.id, placeholder: this.props.data.note === '' ? ZWUtils.locale('Insert note', 'en') : this.props.data.note })
            );
        }
    });

    var ZWTaskList = React.createClass({
        displayName: 'ZWTaskList',

        render: function render() {
            var tasks = this.props.data.map(function (taskItem) {
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

    var ZWTask = React.createClass({
        displayName: 'ZWTask',

        getInitialState: function getInitialState() {
            return { expand: false };
        },
        viewTaskDetails: function viewTaskDetails(e) {
            e.preventDefault();

            this.setState({ expand: !this.state.expand });
        },
        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-task' },
                React.createElement(ZWTimelineDate, { date: ZWUtils.formatDate(this.props.data.dueDate) }),
                React.createElement(ZWCheckbox, { data: this.props.data.status }),
                React.createElement(
                    'a',
                    { onClick: this.viewTaskDetails, className: 'zw-item-name zw-waves', href: '', title: this.props.data.name },
                    this.props.data.name
                ),
                React.createElement(
                    'div',
                    { className: 'zw-task__details' + (this.state.expand ? '' : ' hidden') },
                    this.state.expand ? React.createElement(
                        'form',
                        { action: this.props.data.id, method: 'post' },
                        React.createElement(ZWFormRow, { labelTarget: 'zw-field-task-from--' + this.props.data.id, labelName: 'From', fieldType: 'text', fieldValue: ZWUtils.formatDateFull(this.props.data.from), fieldName: 'zw-field-task-from', fieldId: 'zw-field-task-from--' + this.props.data.id }),
                        React.createElement(ZWFormRow, { labelTarget: 'zw-field-task-due--' + this.props.data.id, labelName: 'Due date', fieldType: 'text', fieldValue: ZWUtils.formatDateFull(this.props.data.dueDate), fieldName: 'zw-field-task-due', fieldId: 'zw-field-task-due--' + this.props.data.id }),
                        React.createElement(ZWFormRow, { labelTarget: 'zw-field-task-effort--' + this.props.data.id, labelName: 'Effort', fieldType: 'text', fieldValue: this.props.data.effort, fieldName: 'zw-field-task-effort', fieldId: 'zw-field-task-effort--' + this.props.data.id }),
                        React.createElement(ZWFormRow, { labelTarget: 'zw-field-task-assign--' + this.props.data.id, labelName: 'Assign', fieldType: 'text', fieldValue: this.props.data.assign, fieldName: 'zw-field-task-assign', fieldId: 'zw-field-task-assign--' + this.props.data.id, placeholder: this.props.data.assign === '' ? ZWUtils.locale('Assign to', 'en') : this.props.data.assign }),
                        React.createElement(ZWFormRow, { labelTarget: 'zw-field-task-note--' + this.props.data.id, labelName: 'Note', fieldType: 'textarea', fieldValue: this.props.data.note, fieldName: 'zw-field-task-note', fieldId: 'zw-field-task-note--' + this.props.data.id, placeholder: this.props.data.note === '' ? ZWUtils.locale('Insert note', 'en') : this.props.data.note })
                    ) : null
                )
            );
        }
    });

    var ZWField = React.createClass({
        displayName: 'ZWField',

        getInitialState: function getInitialState() {
            return { value: this.props.defaultValue };
        },
        updateField: function updateField(e) {
            this.setState({ value: e.target.value });
        },
        handleFocus: function handleFocus(e) {
            if (this.props.focusHandler !== undefined) {
                this.props.focusHandler.call(null, e);
            }
        },
        handleBlur: function handleBlur(e) {
            if (this.props.blurHandler !== undefined) {
                this.props.blurHandler.call(null, e);
            }
        },
        render: function render() {
            var field = null;
            switch (this.props.type) {
                case 'text':
                    field = React.createElement('input', { type: 'text', placeholder: this.props.placeholder, value: this.state.value, name: this.props.name, id: this.props.id, onChange: this.updateField, onFocus: this.handleFocus, onBlur: this.handleBlur });
                    break;
                case 'password':
                    field = React.createElement('input', { type: 'password', placeholder: this.props.placeholder, name: this.props.name, value: this.state.value, id: this.props.id, onChange: this.updateField, onFocus: this.handleFocus, onBlur: this.handleBlur });
                    break;
                case 'textarea':
                    field = React.createElement(
                        'div',
                        { placeholder: this.props.placeholder, className: 'zw-textarea', contentEditable: 'true', id: this.props.id, onChange: this.updateField },
                        this.state.value
                    );
                    break;
            }
            return React.createElement(
                'div',
                { className: 'zw-field' },
                field
            );
        }
    });

    var ZWFormRow = React.createClass({
        displayName: 'ZWFormRow',

        handleFocus: function handleFocus(e) {
            e.preventDefault();

            $('#' + $(e.target).attr('for')).focus();
        },
        render: function render() {
            return React.createElement(
                'div',
                { className: 'zw-form-row' },
                this.props.labelTarget === undefined ? null : React.createElement(
                    'label',
                    { onClick: this.handleFocus, htmlFor: this.props.labelTarget },
                    this.props.labelName
                ),
                React.createElement(ZWField, { focusHandler: this.props.focusHandler, blurHandler: this.props.blurHandler, type: this.props.fieldType, defaultValue: this.props.fieldValue, name: this.props.fieldName, id: this.props.fieldId, placeholder: this.props.placeholder })
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
    var zwAppDom = document.getElementById('zw-app');
    //Project dashboard view
    ZWPubSub.sub('ZWApp.Project:dashboard', function (data) {
        React.render(React.createElement(ZWProjectDashboardPage, { data: data }), zwAppDom);
    });

    //Milestone view
    ZWPubSub.sub('ZWApp.Project:milestone', function (data) {
        React.render(React.createElement(ZWMilestonePage, { backLink: '#!', data: data }), zwAppDom);
    });

    //Deliverable view
    ZWPubSub.sub('ZWApp.Project:deliverable', function (data) {
        React.render(React.createElement(ZWDeliverablePage, { backLink: '#!m/' + data.pid, data: data }), zwAppDom);
    });

    //Message view
    ZWPubSub.sub('ZWApp.Message:app', function (data) {
        React.render(React.createElement(ZWMessagePage, { data: data }), zwAppDom);
    });

    //People view
    ZWPubSub.sub('ZWApp.People:app', function (data) {
        React.render(React.createElement(ZWPeoplePage, { data: data }), zwAppDom);
    });
})(jQuery, Backbone);