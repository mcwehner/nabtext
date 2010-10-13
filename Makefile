mkdir					:= mkdir -p
rm						:= rm -rf
m4						:= m4 --prefix-builtins
closure					:= closure
sed						:= sed
preprocessor_comment	:= \/\/:

SRC						:= src/nabtext.core.js src/binaryfile.js src/parsers/*.js
SRC_LIB					:= $(SRC) src/nabtext.js
SRC_JQUERY				:= $(SRC) src/jquery.nabtext.js

LIB						:= dist/nabtext.js dist/nabtext.mo.js dist/nabtext.po.js
LIB_MINIFIED			:= dist/nabtext.min.js dist/nabtext.mo.min.js dist/nabtext.po.min.js
JQUERY_LIB				:= dist/jquery.nabtext.js

.PHONY: default
default: $(LIB)

.PHONY: minified
minified: $(LIB_MINIFIED)

dist:
	$(mkdir) $@


dist/nabtext.js:	PARSE_INCLUDE	:= -D MO_PARSER -D PO_PARSER
dist/nabtext.mo.js:	PARSE_INCLUDE	:= -D MO_PARSER
dist/nabtext.po.js:	PARSE_INCLUDE	:= -D PO_PARSER

$(LIB): dist $(SRC_LIB)
	$(m4) $(PARSE_INCLUDE) -I src src/nabtext.js | $(sed) -e 's/$(preprocessor_comment)//g' > $@

$(LIB_MINIFIED): %.min.js: %.js
	$(closure) --js $< --js_output_file $@


.PHONY: clean
clean:
	$(rm) dist