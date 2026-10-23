"""Build Eigenflow's Computer Modern web fonts from CMU Serif.

Sources (CTAN): fonts/cm-unicode/fonts/otf/{cmunrm,cmunti,cmunbx}.otf (OFL) and
fonts/lm-math/opentype/latinmodern-math.otf (GUST Font License) for ≈.

Computer Modern has no precomposed subscript digits because TeX sets subscripts
in math mode, at 70% size lowered by ~0.15 em. We bake exactly that into
U+2080–2089 so strings like "λ₂" stay in one typeface. Outlines are converted to
TrueType so browsers' font sanitizer accepts the added glyphs.

Usage: python -I scripts/build_cmu_fonts.py <source-dir> <output-dir>
"""

import sys
from pathlib import Path

from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont, newTable

SUB_SCALE = 0.7
SUB_SHIFT = -150  # font units; CMU and Latin Modern Math are both 1000 upm
SUB_TRANSFORM = (SUB_SCALE, 0, 0, SUB_SCALE, 0, SUB_SHIFT)
UNICODES = (
    list(range(0x20, 0x7F))
    + list(range(0xA0, 0x100))
    + [0x304]
    + list(range(0x391, 0x3AA))
    + list(range(0x3B1, 0x3CA))
    + list(range(0x2000, 0x2070))
    + [0x2190, 0x2191, 0x2192, 0x2193, 0x2212, 0x221A]
)
FEATURES = ["kern", "liga", "ccmp", "locl", "mark", "mkmk"]


def quadratic_glyph(draw):
    pen = TTGlyphPen(None)
    draw(Cu2QuPen(pen, max_err=1.0, reverse_direction=True))
    return pen.glyph()


def build(source: Path, math: TTFont, output: Path) -> None:
    font = TTFont(source)
    options = Options()
    options.layout_features = FEATURES
    options.name_IDs = ["*"]
    options.drop_tables += ["FFTM", "TeX "]
    subsetter = Subsetter(options)
    subsetter.populate(unicodes=UNICODES)
    subsetter.subset(font)

    glyph_set = font.getGlyphSet()
    order = font.getGlyphOrder()
    glyf = newTable("glyf")
    glyf.glyphOrder = list(order)
    glyf.glyphs = {name: quadratic_glyph(glyph_set[name].draw) for name in order}
    metrics = font["hmtx"].metrics
    cmap = font.getBestCmap()
    additions = {}

    for digit in range(10):
        base = cmap[0x30 + digit]
        additions[0x2080 + digit] = (
            f"uni208{digit}",
            quadratic_glyph(
                lambda pen, b=base: glyph_set[b].draw(TransformPen(pen, SUB_TRANSFORM))
            ),
            round(metrics[base][0] * SUB_SCALE),
        )
    approx = math.getBestCmap()[0x2248]
    additions[0x2248] = (
        "approxequal",
        quadratic_glyph(math.getGlyphSet()[approx].draw),
        math["hmtx"].metrics[approx][0],
    )

    for codepoint, (name, glyph, advance) in additions.items():
        glyf.glyphOrder.append(name)
        glyf.glyphs[name] = glyph
        metrics[name] = (advance, 0)
        for table in font["cmap"].tables:
            if table.isUnicode():
                table.cmap[codepoint] = name

    font.setGlyphOrder(glyf.glyphOrder)
    del font["CFF "]
    font["glyf"] = glyf
    font["loca"] = newTable("loca")
    font.sfntVersion = "\x00\x01\x00\x00"
    font["head"].glyphDataFormat = 0
    font["head"].indexToLocFormat = 0
    maxp = font["maxp"]
    maxp.tableVersion = 0x00010000
    for field in (
        "maxZones", "maxTwilightPoints", "maxStorage", "maxFunctionDefs",
        "maxInstructionDefs", "maxStackElements", "maxSizeOfInstructions",
        "maxComponentElements",
    ):
        setattr(maxp, field, 0)
    maxp.maxZones = 1
    post = font["post"]
    post.formatType = 3.0
    for attribute in ("extraNames", "mapping"):
        if hasattr(post, attribute):
            delattr(post, attribute)
    for glyph in glyf.glyphs.values():
        glyph.recalcBounds(glyf)

    font.flavor = "woff2"
    font.save(output)
    covered = TTFont(output).getBestCmap()
    print(output.name, "sub2", 0x2082 in covered, "approx", 0x2248 in covered,
          "lambda", 0x3BB in covered, output.stat().st_size, "bytes")


if __name__ == "__main__":
    source_dir, output_dir = Path(sys.argv[1]), Path(sys.argv[2])
    math_font = TTFont(source_dir / "lmmath.otf")
    for source_name, output_name in (
        ("cmunrm.otf", "cmu-serif-roman.woff2"),
        ("cmunti.otf", "cmu-serif-italic.woff2"),
        ("cmunbx.otf", "cmu-serif-bold.woff2"),
    ):
        build(source_dir / source_name, math_font, output_dir / output_name)
