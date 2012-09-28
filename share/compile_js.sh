OUTPUT_FILE="Yeapsy.min.js"
JS_FOLDER="../public/js"
CLOSURE_COMPILER="/usr/local/bin/closure-compiler.jar"
# order matters
JS_FILES="\
YeapsyVars.js \
YeapsyLayout.js \
YeapsyAuth.js \
Yeapsy.js \
YeapsyDashboard.js \
YeapsyUser.js \
YeapsyEvent.js \
YeapsyApplication.js \
YeapsyEventApplication.js \
YeapsyEvaluation.js \
YeapsyFeedback.js"


if [ -n "$1" ]; then
    CLOSURE_COMPILER=$1
fi

if [ ! -f $CLOSURE_COMPILER ]; then
    echo "Usage: ./compile_js.sh <path-to-closure-compiler.jar>"
    echo "Closure-compiler defaults to: $CLOSURE_COMPILER"
    exit 1
fi

cd $JS_FOLDER

if [ -f $OUTPUT_FILE ]; then
    rm $OUTPUT_FILE
fi

compiler_args=""
for FILE in $JS_FILES; do
    compiler_args+=" --js=$FILE"
done

java -jar $CLOSURE_COMPILER $compiler_args --js_output_file=$OUTPUT_FILE

if [ $? -ne 0 ]; then
    echo "Error compiling js"
    exit 1
fi

echo "Files compiled correctly"