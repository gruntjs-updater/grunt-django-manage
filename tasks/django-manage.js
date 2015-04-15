/**
 * @fileOverview
 * Tasks for running Djangos manage.py commands
 *
 * @module DjangoManage
 * @requires child_process.spawn
 * @requires path.join
 */
var spawn = require('child_process').spawn,
    join = require('path').join;

module.exports = function (grunt) {

    var command;

    /**
     * Kills a running node spawn command
     * @private
     */
    function kill () {
        if (command) {
            command.kill();
        }
    }

    /**
     * Runs the Django command and uses done with async or not
     * @private
     * @param  {String}   cmd  The Django command to run (after manage.py)
     * @param  {Function} done Contains how to say done, async or not
     */
    function runCommand (cmd, done) {
        if (process.platform === 'win32') {
            command = spawn(
                'cmd.exe',
                ['/s', '/c', '"' + cmd + '"'],
                {windowsVerbatimArguments: true}
            );
        } else {
            command = spawn('/bin/sh', ['-c', cmd]);
        }

        command.stdout.on('data', function (data) {
            grunt.log.write(data);
        });

        command.stderr.on('data', function (data) {
            grunt.log.error(data);
        });

        command.on('close', function (code) {
            if (code > 0) {
                grunt.log.error(
                    'Django command "' + cmd + '" exited with code ' + code
                );
                grunt.fail.fatal('Django management command failed.');
                done(false);
            } else {
                done(true);
            }
        });
    }

    /**
     * Makes the Django command based on options and data passed from Grunt
     * @private
     * @param  {Object} options Base options for the Grunt task
     * @param  {Object} data    Extra data to be passed by sub-task
     * @return {String}         The full build Django manage command
     */
    function makeCommand (options, data) {
        var args = ['python'],
            managePath;

        for (var attr in data) {
            options[attr] = data[attr];
        }

        managePath = options.managePath || '';
        args.push(join(managePath, 'manage.py'));
        args.push(options.command);

        if (typeof options.args !== 'undefined' && options.args.length > 0) {
            args.push(options.args.join(' '));
        }

        if (options.settings) {
            settings = '--settings=' +
                options.app + '.settings.' + options.settings;
            args.push(settings);
        }

        return args.join(' ');
    }

    /**
     * TASK: Django manage Grunt task.
     *
     * @name django-manage
     * @memberOf module:DjangoManage
     */
    grunt.task.registerMultiTask('django-manage', function () {
        // Use node lodash merge clean this up also allows for more data to be
        // used passed through for opstions from dist:{} etc.
        var options = this.options(),
            task = this.args[0],
            data = this.data[task] || {},
            cmd = makeCommand(options, data),
            done = this.async();

        grunt.log.ok('Using command: ' + cmd.yellow);
        runCommand(cmd, done);
    });

    /**
     * Sets on exit of task what to do
     * @private
     */
    process.on('exit', function () {
        kill();
    });

};
