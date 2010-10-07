mkdir					:= mkdir -p
rm						:= rm -rf
m4						:= m4
closure					:= closure
sed						:= sed
preprocessor_comment	:= \/\/:

.PHONY: default
default: dist/nabtext.js dist/jquery.nabtext.js

.PHONY: minified
minified: dist/nabtext.min.js dist/jquery.nabtext.min.js

# This is really just an alias for the target `minified'.
.PHONY: all
all: minified


dist:
	$(mkdir) dist

# nabtext
dist/nabtext.js: dist src/*.js src/**/*.js
	$(m4) -I src src/nabtext.js | $(sed) -e 's/$(preprocessor_comment)//g' > $@

dist/nabtext.min.js: dist/nabtext.js
	$(closure) --js dist/nabtext.js --js_output_file $@

# jquery.nabtext
dist/jquery.nabtext.js: dist src/*.js src/**/*.js
	$(m4) -I src src/jquery.nabtext.js | $(sed) -e 's/$(preprocessor_comment)//g' > $@

dist/jquery.nabtext.min.js: dist/jquery.nabtext.js
	$(closure) --js dist/jquery.nabtext.js --js_output_file $@


.PHONY: clean
clean:
	$(rm) dist