module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
      },
      js: {
        src: [  // '<%= pkg.name %>.js',
          'node_modules/angular/angular.min.js',
          'node_modules/angular-route/angular-route.min.js',
          'node_modules/ng-dialog/js/ngDialog.min.js',
          'controllers/*.js',
          'app.js',
          'route.js'
        ],
        dest: 'dist/<%= pkg.name %>.min.<%= pkg.version %>.js' //合并文件
      },
      css: {
        src: [
          'node_modules/bootstrap/dist/css/bootstrap.min.css',
          'node_modules/ng-dialog/css/ngDialog.min.css',
          'css/me.min.css'
        ],
        dest: 'dist/<%= pkg.name %>.min.<%= pkg.version %>.css'
      }
    },
    less: {
        css: {
            src: 'less/style.less',
            dest: 'css/me.css' //压缩
        },
//        share: {
//            src: 'less/share.less',
//            dest: 'css/share.css' //压缩
//        }
    },
    cssmin: { //css文件压缩
      css: {
        src: 'css/me.css', //将之前的all.css
        dest: 'css/me.min.css' //压缩
      },
//      share: {
//        src: 'css/share.css',
//        dest: 'dist/share.min.css' //压缩
//      }
    },
    uglify: {
      options: {
        // banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: ['controllers/club.js', 'app.js', 'route.js'],
        dest: 'dist/m.js'
      }
    },
    clean: {
      start: {
        src: ['dist/*'],
        filter: 'isFile'
      },
      end: {
        src: ['css/*'],
        filter: 'isFile'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['clean:start', 'less', 'cssmin', 'concat']);

};