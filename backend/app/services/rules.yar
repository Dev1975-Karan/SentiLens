
rule UPX_Packed {
    meta:
        description = "Detects UPX packed executables"
        author = "SentinelLens"
        reference = "https://upx.github.io"
    strings:
        $upx = "UPX!" ascii
    condition:
        $upx
}
