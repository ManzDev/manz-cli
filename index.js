#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const exec = require('child_process').execSync;
const inquirer = require('inquirer');
const ora = require('ora');
const colors = require('colors');

const npm = [];
const npmdev = [];
const npmglobal = [];

const srcPath = __dirname;

const choices = {
  babel: ['No', 'Babel + preset-env (recomendado)'],
  compatibility: ['No', 'Básica (>5%)', 'Media (>2% + last 1 + IE11)', 'Fuerte (>1% + last 2 + IE11)', 'Heavy (>1% + last 5 + IE8)'],
  eslint: ['No', 'Sí, con eslint-config-google', 'Sí, con eslint-config-standard', 'Sí, con eslint-config-airbnb'],
  git: ['No', 'Sí, inicializarlo'],
  postcss: ['No', 'Sí (Autoprefixer)', 'Sí (Autoprefixer + Preset-env)', 'Sí (Autoprefixer + Preset-Env + Mixins + Font Magician + CleanCSS'],
  stylelint: ['No', 'Sí, stylelint-config-standard', 'Sí, stylelint-config-recommended', 'Sí, stylelint-config-prettier'],
  bundler: ['Ninguno', 'Parcel', 'Parcel (con Bundle-Visualiser)'],
  framework: ['No', 'Sí, Vue.js'],
  npminstall: ['No', 'Sí']
}

const execute = commandline => {
  exec(commandline, (err, stdout, stderr) => {
    console.log(stdout);
    if (err)
      console.error(err + ': ' + stderr);
  });
};

const filewrite = (file, contents) => {
  process.chdir(process.cwd());
  fs.writeFileSync(file, contents);
}

const readfile = (file) => {
  if (fs.existsSync(srcPath + path.sep + file))
    return fs.readFileSync(srcPath + path.sep + file);

  return false;
}

inquirer.prompt([
  {
    name: 'babel',
    type: 'list',
    message: '¿Quieres instalar Babel?',
    choices: choices.babel,
    default: 1
  },
  {
    name: 'compatibility',
    type: 'list',
    message: '¿Quieres dotar de retrocompatibilidad a tu proyecto?',
    choices: choices.compatibility,
    default: 2
  },
  {
    name: 'eslint',
    type: 'list',
    message: '¿Quieres revisar la calidad de código de Javascript?',
    choices: choices.eslint,
    default: 2
  },
  {
    name: 'git',
    type: 'list',
    message: '¿Quieres utilizar Git en tu proyecto?',
    choices: choices.git,
    default: 1
  },
  {
    name: 'postcss',
    type: 'list',
    message: '¿Quieres utilizar PostCSS en tu proyecto?',
    choices: choices.postcss,
    default: 3
  },
  {
    name: 'stylelint',
    type: 'list',
    message: '¿Quieres revisar la calidad de código de CSS?',
    choices: choices.stylelint,
    default: 1
  },
  {
    name: 'bundler',
    type: 'list',
    message: '¿Qué automatizador (bundler) quieres utilizar?',
    choices: choices.bundler,
    default: 1
  },
  {
    name: 'framework',
    type: 'list',
    message: '¿Vas a utilizar algún framework Javascript?',
    choices: choices.framework,
    default: 0
  },
  {
    name: 'npminstall',
    type: 'list',
    message: '¿Quieres instalar los paquetes del proyecto automáticamente?',
    choices: choices.npminstall,
    default: 0
  }
]).then(answers => {

  /* NPM */

  if (!fs.existsSync('package.json'))
    execute('npm init -y');

  const package = JSON.parse(fs.readFileSync('package.json'));
  npmdev.push('npm-run-all', 'cross-env');

  /* Babel */

  let option = choices.babel.indexOf(answers.babel);

  if (option > 0) {
    const babel = { presets: ["@babel/preset-env"] };
    npmdev.push('@babel/cli', '@babel/core', '@babel/preset-env');
    filewrite('.babelrc', JSON.stringify(babel, null, 4));
  }

  /* BrowsersList */

  option = choices.compatibility.indexOf(answers.compatibility);

  if (option > 0) {
    const compatibility = [
      `> 5%`,
      `last 1 version\n> 2%\nIE 11`,
      `last 2 version\n> 1%\nIE 11`,
      `last 5 version\n> 1%\nIE 8`
    ];
    filewrite('.browserslistrc', compatibility[option - 1]);
  }

  /* ESLint */

  const eslint = JSON.parse(readfile('.eslintrc.json.sample'));
  option = choices.eslint.indexOf(answers.eslint);

  if (option > 0) {
    eslint.extends.push("eslint:recommended");
    const guides = ['google', 'standard', 'airbnb'];
    eslint.extends.push(guides[option - 1]);
    npmdev.push('eslint', 'eslint-plugin-import', 'eslint-plugin-node', 'eslint-plugin-promise', 'eslint-plugin-standard');
    npmdev.push('eslint-config-' + guides[option - 1]);
  }

  /* Git */

  option = choices.git.indexOf(answers.git);

  if (option > 0) {
    exec('git init');
    filewrite('.gitignore', `node_modules\n.cache\ndist`);
  }

  /* PostCSS */

  option = choices.postcss.indexOf(answers.postcss);

  if (option > 0) {
    const postcss = { plugins: {} };
    switch (option) {
      case 1:
        postcss.plugins = { autoprefixer: true };
        npmdev.push('autoprefixer');
        break;
      case 2:
        postcss.plugins = {
          "postcss-preset-env": {
            stage: 3,
            features: {
              "nesting-rules": true,
              "case-insensitive-attributes": true,
              "hexadecimal-alpha-notation": true,
              "place-properties": true
            }
          },
          autoprefixer: true
        };
        npmdev.push('autoprefixer', 'postcss-preset-env');
        break;
      case 3:
        postcss.plugins = {
          "postcss-mixins": true,
          "postcss-preset-env": {
            stage: 3,
            features: {
              "nesting-rules": true,
              "case-insensitive-attributes": true,
              "hexadecimal-alpha-notation": true,
              "place-properties": true
            }
          },
          "postcss-font-magician": true,
          autoprefixer: true,
          "postcss-clean": true
        };
        npmdev.push('autoprefixer', 'postcss-preset-env', 'postcss-mixins', 'postcss-font-magician', 'postcss-clean');
        break;
    }
    filewrite('.postcssrc', JSON.stringify(postcss, null, 4));
  }

  /* StyleLint */

  option = choices.stylelint.indexOf(answers.stylelint);

  if (option > 0) {
    const stylelint = {
      extends: [],
      rules: {
        "selector-nested-pattern": "^&",
        "indentation": 2,
        "no-descending-specificity": null,
        "no-eol-whitespace": null,
        "declaration-empty-line-before": null
      }
    };
    switch (option) {
      case 1:
        stylelint.extends.push('stylelint-config-standard');
        npmdev.push('stylelint-config-standard');
        break;
      case 2:
        stylelint.extends.push('stylelint-config-recommended');
        npmdev.push('stylelint-config-recommended');
        break;
      case 3:
        stylelint.extends.push('stylelint-config-prettier');
        npmdev.push('stylelint-config-prettier');
        break;
    }
    filewrite('.stylelintrc', JSON.stringify(stylelint, null, 4));
  }

  /* Bundler */
  option = choices.bundler.indexOf(answers.bundler);

  if (option > 0) {
    npmglobal.push('parcel-bundler');
    package.scripts.dev = 'parcel serve src/index.html --open';
    package.scripts.watch = 'parcel watch src/index.html';
    package.scripts.build = 'rm -rf build/* && parcel build src/index.html -d build --global global --public-url /';
    package.scripts.test = 'npx eslint src/*';
    package.scripts['clean:cache'] = 'rm -rf .cache dist build';
    package.scripts['clean:all'] = 'rm -rf node_modules package-lock.json .cache dist build';
    package.scripts.deploy = 'git subtree push --prefix build origin gh-pages';
    switch (option) {
      case 2:
        npmdev.push('parcel-plugin-bundle-visualiser');
        break;
    }
  } else {
    npmglobal.push('live-server');
    package.scripts.dev = 'live-server src/index.html'
    package.scripts.test = 'npx eslint src/*'
  }

  /* Framework */
  option = choices.framework.indexOf(answers.framework);

  if (option > 0) {

    switch (option) {
      case 1:
        npmdev.push('@vue/component-compiler-utils', 'vue-hot-reload-api', 'vue-template-compiler');
        npm.push('vue');
        if (choices.eslint.indexOf(answers.eslint) > 0) {
          npmdev.push('eslint-plugin-vue');
          eslint.extends.push('plugin:vue/recommended');
          eslint.plugins = ['vue'];
          eslint.rules['vue/html-self-closing'] = 'off';
          eslint.rules['vue/max-attributes-per-line'] = ['error', { singleline: 3, multiline: { max: 1, allowFirstLine: true }}];
        }
        break;
    }

  }

  /* VSCode */
  if (!fs.existsSync('.vscode'))
    execute('mkdir .vscode');

  const vscode = JSON.parse(readfile('settings.json.sample'));

  if (choices.stylelint.indexOf(answers.stylelint) > 0) {
    vscode['css.validate'] = false;
    vscode['less.validate'] = false;
    vscode['scss.validate'] = false;
  }

  if (choices.eslint.indexOf(answers.eslint) > 0) {
    vscode['eslint.validate'] = ['javascript'];

    if (choices.framework.indexOf(answers.framework) == 1) {
      vscode['emmet.includeLanguages'] = { vue: 'html' };
      vscode['eslint.validate'].push({ language: 'vue', autoFix: true });
    }
  }
  filewrite('.vscode/settings.json', JSON.stringify(vscode, null, 4));

  /* Finish */
  filewrite('.eslintrc.json', JSON.stringify(eslint, null, 4));
  filewrite('package.json', JSON.stringify(package, null, 4));

  if (!fs.existsSync('src'))
    execute('mkdir src');

  /* NPM Install */

  option = choices.npminstall.indexOf(answers.npminstall);

  if (option == 0)
    npminstall = '--package-lock-only';

  const oraOptions = {
    color: 'yellow',
    spinner: 'clock'
  }

  console.log("");
  let spinner = ora({...oraOptions, text: 'Organizando archivos...'}).start();
  spinner.succeed();

  spinner.start('Configurando dependencias...');
  execute(`npm install --loglevel=error ${npminstall} --save-dev ${npmdev.join(' ')}`);
  spinner.succeed();

  spinner.start('Configurando paquetes de producción...');
  execute(`npm install --loglevel=error ${npminstall} ${npm.join(' ')}`);
  spinner.succeed();

  spinner.stop();

  if (npmglobal.length > 0) {
    console.log("\nRecuerda que debes instalar los siguientes paquetes globales (necesitarás permisos):".red);
    console.log(" # ".green + `npm install -g ${npmglobal.join(' ')}`);
  }

});