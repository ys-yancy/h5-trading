/*
  Basic GUI blocking jpeg encoder ported to JavaScript and optimized by 
  Andreas Ritter, www.bytestrom.eu, 11/2009.
  Example usage is given at the bottom of this file.
  ---------
  Copyright (c) 2008, Adobe Systems Incorporated
  All rights reserved.
  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are
  met:
  * Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  * Neither the name of Adobe Systems Incorporated nor the names of its
    contributors may be used to endorse or promote products derived from
    this software without specific prior written permission.
  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
  IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
  THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
  PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
  CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

function JPEGEncoder(quality) {
  var self = this;
    var fround = Math.round;
    var ffloor = Math.floor;
    var YTable = new Array(64);
    var UVTable = new Array(64);
    var fdtbl_Y = new Array(64);
    var fdtbl_UV = new Array(64);
    var YDC_HT;
    var UVDC_HT;
    var YAC_HT;
    var UVAC_HT;

    var bitcode = new Array(65535);
    var category = new Array(65535);
    var outputfDCTQuant = new Array(64);
    var DU = new Array(64);
    var byteout = [];
    var bytenew = 0;
    var bytepos = 7;

    var YDU = new Array(64);
    var UDU = new Array(64);
    var VDU = new Array(64);
    var clt = new Array(256);
    var RGB_YUV_TABLE = new Array(2048);
    var currentQuality;

    var ZigZag = [
             0, 1, 5, 6,14,15,27,28,
             2, 4, 7,13,16,26,29,42,
             3, 8,12,17,25,30,41,43,
             9,11,18,24,31,40,44,53,
            10,19,23,32,39,45,52,54,
            20,22,33,38,46,51,55,60,
            21,34,37,47,50,56,59,61,
            35,36,48,49,57,58,62,63
        ];

    var std_dc_luminance_nrcodes = [0,0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0];
    var std_dc_luminance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
    var std_ac_luminance_nrcodes = [0,0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,0x7d];
    var std_ac_luminance_values = [
            0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,
            0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
            0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,
            0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
            0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,
            0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
            0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,
            0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
            0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
            0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
            0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,
            0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
            0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,
            0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
            0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
            0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
            0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,
            0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
            0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,
            0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
            0xf9,0xfa
        ];

    var std_dc_chrominance_nrcodes = [0,0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0];
    var std_dc_chrominance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
    var std_ac_chrominance_nrcodes = [0,0,2,1,2,4,4,3,4,7,5,4,4,0,1,2,0x77];
    var std_ac_chrominance_values = [
            0x00,0x01,0x02,0x03,0x11,0x04,0x05,0x21,
            0x31,0x06,0x12,0x41,0x51,0x07,0x61,0x71,
            0x13,0x22,0x32,0x81,0x08,0x14,0x42,0x91,
            0xa1,0xb1,0xc1,0x09,0x23,0x33,0x52,0xf0,
            0x15,0x62,0x72,0xd1,0x0a,0x16,0x24,0x34,
            0xe1,0x25,0xf1,0x17,0x18,0x19,0x1a,0x26,
            0x27,0x28,0x29,0x2a,0x35,0x36,0x37,0x38,
            0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,
            0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,
            0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,
            0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,
            0x79,0x7a,0x82,0x83,0x84,0x85,0x86,0x87,
            0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,
            0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,
            0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,
            0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,
            0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xd2,
            0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,
            0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,
            0xea,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
            0xf9,0xfa
        ];

    function initQuantTables(sf){
            var YQT = [
                16, 11, 10, 16, 24, 40, 51, 61,
                12, 12, 14, 19, 26, 58, 60, 55,
                14, 13, 16, 24, 40, 57, 69, 56,
                14, 17, 22, 29, 51, 87, 80, 62,
                18, 22, 37, 56, 68,109,103, 77,
                24, 35, 55, 64, 81,104,113, 92,
                49, 64, 78, 87,103,121,120,101,
                72, 92, 95, 98,112,100,103, 99
            ];

            for (var i = 0; i < 64; i++) {
                var t = ffloor((YQT[i]*sf+50)/100);
                if (t < 1) {
                    t = 1;
                } else if (t > 255) {
                    t = 255;
                }
                YTable[ZigZag[i]] = t;
            }
            var UVQT = [
                17, 18, 24, 47, 99, 99, 99, 99,
                18, 21, 26, 66, 99, 99, 99, 99,
                24, 26, 56, 99, 99, 99, 99, 99,
                47, 66, 99, 99, 99, 99, 99, 99,
                99, 99, 99, 99, 99, 99, 99, 99,
                99, 99, 99, 99, 99, 99, 99, 99,
                99, 99, 99, 99, 99, 99, 99, 99,
                99, 99, 99, 99, 99, 99, 99, 99
            ];
            for (var j = 0; j < 64; j++) {
                var u = ffloor((UVQT[j]*sf+50)/100);
                if (u < 1) {
                    u = 1;
                } else if (u > 255) {
                    u = 255;
                }
                UVTable[ZigZag[j]] = u;
            }
            var aasf = [
                1.0, 1.387039845, 1.306562965, 1.175875602,
                1.0, 0.785694958, 0.541196100, 0.275899379
            ];
            var k = 0;
            for (var row = 0; row < 8; row++)
            {
                for (var col = 0; col < 8; col++)
                {
                    fdtbl_Y[k]  = (1.0 / (YTable [ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                    fdtbl_UV[k] = (1.0 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                    k++;
                }
            }
        }

        function computeHuffmanTbl(nrcodes, std_table){
            var codevalue = 0;
            var pos_in_table = 0;
            var HT = new Array();
            for (var k = 1; k <= 16; k++) {
                for (var j = 1; j <= nrcodes[k]; j++) {
                    HT[std_table[pos_in_table]] = [];
                    HT[std_table[pos_in_table]][0] = codevalue;
                    HT[std_table[pos_in_table]][1] = k;
                    pos_in_table++;
                    codevalue++;
                }
                codevalue*=2;
            }
            return HT;
        }

        function initHuffmanTbl()
        {
            YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes,std_dc_luminance_values);
            UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes,std_dc_chrominance_values);
            YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes,std_ac_luminance_values);
            UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes,std_ac_chrominance_values);
        }

        function initCategoryNumber()
        {
            var nrlower = 1;
            var nrupper = 2;
            for (var cat = 1; cat <= 15; cat++) {
                //Positive numbers
                for (var nr = nrlower; nr<nrupper; nr++) {
                    category[32767+nr] = cat;
                    bitcode[32767+nr] = [];
                    bitcode[32767+nr][1] = cat;
                    bitcode[32767+nr][0] = nr;
                }
                //Negative numbers
                for (var nrneg =-(nrupper-1); nrneg<=-nrlower; nrneg++) {
                    category[32767+nrneg] = cat;
                    bitcode[32767+nrneg] = [];
                    bitcode[32767+nrneg][1] = cat;
                    bitcode[32767+nrneg][0] = nrupper-1+nrneg;
                }
                nrlower <<= 1;
                nrupper <<= 1;
            }
        }

        function initRGBYUVTable() {
            for(var i = 0; i < 256;i++) {
                RGB_YUV_TABLE[i]              =  19595 * i;
                RGB_YUV_TABLE[(i+ 256)>>0]     =  38470 * i;
                RGB_YUV_TABLE[(i+ 512)>>0]     =   7471 * i + 0x8000;
                RGB_YUV_TABLE[(i+ 768)>>0]     = -11059 * i;
                RGB_YUV_TABLE[(i+1024)>>0]     = -21709 * i;
                RGB_YUV_TABLE[(i+1280)>>0]     =  32768 * i + 0x807FFF;
                RGB_YUV_TABLE[(i+1536)>>0]     = -27439 * i;
                RGB_YUV_TABLE[(i+1792)>>0]     = - 5329 * i;
            }
        }

        // IO functions
        function writeBits(bs)
        {
            var value = bs[0];
            var posval = bs[1]-1;
            while ( posval >= 0 ) {
                if (value & (1 << posval) ) {
                    bytenew |= (1 << bytepos);
                }
                posval--;
                bytepos--;
                if (bytepos < 0) {
                    if (bytenew == 0xFF) {
                        writeByte(0xFF);
                        writeByte(0);
                    }
                    else {
                        writeByte(bytenew);
                    }
                    bytepos=7;
                    bytenew=0;
                }
            }
        }

        function writeByte(value)
        {
            byteout.push(clt[value]); // write char directly instead of converting later
        }

        function writeWord(value)
        {
            writeByte((value>>8)&0xFF);
            writeByte((value   )&0xFF);
        }

        // DCT & quantization core
        function fDCTQuant(data, fdtbl)
        {
            var d0, d1, d2, d3, d4, d5, d6, d7;
            /* Pass 1: process rows. */
            var dataOff=0;
            var i;
            const I8 = 8;
            const I64 = 64;
            for (i=0; i<I8; ++i)
            {
                d0 = data[dataOff];
                d1 = data[dataOff+1];
                d2 = data[dataOff+2];
                d3 = data[dataOff+3];
                d4 = data[dataOff+4];
                d5 = data[dataOff+5];
                d6 = data[dataOff+6];
                d7 = data[dataOff+7];

                var tmp0 = d0 + d7;
                var tmp7 = d0 - d7;
                var tmp1 = d1 + d6;
                var tmp6 = d1 - d6;
                var tmp2 = d2 + d5;
                var tmp5 = d2 - d5;
                var tmp3 = d3 + d4;
                var tmp4 = d3 - d4;

                /* Even part */
                var tmp10 = tmp0 + tmp3;    /* phase 2 */
                var tmp13 = tmp0 - tmp3;
                var tmp11 = tmp1 + tmp2;
                var tmp12 = tmp1 - tmp2;

                data[dataOff] = tmp10 + tmp11; /* phase 3 */
                data[dataOff+4] = tmp10 - tmp11;

                var z1 = (tmp12 + tmp13) * 0.707106781; /* c4 */
                data[dataOff+2] = tmp13 + z1; /* phase 5 */
                data[dataOff+6] = tmp13 - z1;

                /* Odd part */
                tmp10 = tmp4 + tmp5; /* phase 2 */
                tmp11 = tmp5 + tmp6;
                tmp12 = tmp6 + tmp7;

                /* The rotator is modified from fig 4-8 to avoid extra negations. */
                var z5 = (tmp10 - tmp12) * 0.382683433; /* c6 */
                var z2 = 0.541196100 * tmp10 + z5; /* c2-c6 */
                var z4 = 1.306562965 * tmp12 + z5; /* c2+c6 */
                var z3 = tmp11 * 0.707106781; /* c4 */

                var z11 = tmp7 + z3;    /* phase 5 */
                var z13 = tmp7 - z3;

                data[dataOff+5] = z13 + z2;    /* phase 6 */
                data[dataOff+3] = z13 - z2;
                data[dataOff+1] = z11 + z4;
                data[dataOff+7] = z11 - z4;

                dataOff += 8; /* advance pointer to next row */
            }

            /* Pass 2: process columns. */
            dataOff = 0;
            for (i=0; i<I8; ++i)
            {
                d0 = data[dataOff];
                d1 = data[dataOff + 8];
                d2 = data[dataOff + 16];
                d3 = data[dataOff + 24];
                d4 = data[dataOff + 32];
                d5 = data[dataOff + 40];
                d6 = data[dataOff + 48];
                d7 = data[dataOff + 56];

                var tmp0p2 = d0 + d7;
                var tmp7p2 = d0 - d7;
                var tmp1p2 = d1 + d6;
                var tmp6p2 = d1 - d6;
                var tmp2p2 = d2 + d5;
                var tmp5p2 = d2 - d5;
                var tmp3p2 = d3 + d4;
                var tmp4p2 = d3 - d4;

                /* Even part */
                var tmp10p2 = tmp0p2 + tmp3p2;    /* phase 2 */
                var tmp13p2 = tmp0p2 - tmp3p2;
                var tmp11p2 = tmp1p2 + tmp2p2;
                var tmp12p2 = tmp1p2 - tmp2p2;

                data[dataOff] = tmp10p2 + tmp11p2; /* phase 3 */
                data[dataOff+32] = tmp10p2 - tmp11p2;

                var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781; /* c4 */
                data[dataOff+16] = tmp13p2 + z1p2; /* phase 5 */
                data[dataOff+48] = tmp13p2 - z1p2;

                /* Odd part */
                tmp10p2 = tmp4p2 + tmp5p2; /* phase 2 */
                tmp11p2 = tmp5p2 + tmp6p2;
                tmp12p2 = tmp6p2 + tmp7p2;

                /* The rotator is modified from fig 4-8 to avoid extra negations. */
                var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433; /* c6 */
                var z2p2 = 0.541196100 * tmp10p2 + z5p2; /* c2-c6 */
                var z4p2 = 1.306562965 * tmp12p2 + z5p2; /* c2+c6 */
                var z3p2 = tmp11p2 * 0.707106781; /* c4 */
                var z11p2 = tmp7p2 + z3p2;    /* phase 5 */
                var z13p2 = tmp7p2 - z3p2;

                data[dataOff+40] = z13p2 + z2p2; /* phase 6 */
                data[dataOff+24] = z13p2 - z2p2;
                data[dataOff+ 8] = z11p2 + z4p2;
                data[dataOff+56] = z11p2 - z4p2;

                dataOff++; /* advance pointer to next column */
            }

            // Quantize/descale the coefficients
            var fDCTQuant;
            for (i=0; i<I64; ++i)
            {
                // Apply the quantization and scaling factor & Round to nearest integer
                fDCTQuant = data[i]*fdtbl[i];
                outputfDCTQuant[i] = (fDCTQuant > 0.0) ? ((fDCTQuant + 0.5)|0) : ((fDCTQuant - 0.5)|0);
                //outputfDCTQuant[i] = fround(fDCTQuant);

            }
            return outputfDCTQuant;
        }

        function writeAPP0()
        {
            writeWord(0xFFE0); // marker
            writeWord(16); // length
            writeByte(0x4A); // J
            writeByte(0x46); // F
            writeByte(0x49); // I
            writeByte(0x46); // F
            writeByte(0); // = "JFIF",'\0'
            writeByte(1); // versionhi
            writeByte(1); // versionlo
            writeByte(0); // xyunits
            writeWord(1); // xdensity
            writeWord(1); // ydensity
            writeByte(0); // thumbnwidth
            writeByte(0); // thumbnheight
        }

        function writeSOF0(width, height)
        {
            writeWord(0xFFC0); // marker
            writeWord(17);   // length, truecolor YUV JPG
            writeByte(8);    // precision
            writeWord(height);
            writeWord(width);
            writeByte(3);    // nrofcomponents
            writeByte(1);    // IdY
            writeByte(0x11); // HVY
            writeByte(0);    // QTY
            writeByte(2);    // IdU
            writeByte(0x11); // HVU
            writeByte(1);    // QTU
            writeByte(3);    // IdV
            writeByte(0x11); // HVV
            writeByte(1);    // QTV
        }

        function writeDQT()
        {
            writeWord(0xFFDB); // marker
            writeWord(132);       // length
            writeByte(0);
            for (var i=0; i<64; i++) {
                writeByte(YTable[i]);
            }
            writeByte(1);
            for (var j=0; j<64; j++) {
                writeByte(UVTable[j]);
            }
        }

        function writeDHT()
        {
            writeWord(0xFFC4); // marker
            writeWord(0x01A2); // length

            writeByte(0); // HTYDCinfo
            for (var i=0; i<16; i++) {
                writeByte(std_dc_luminance_nrcodes[i+1]);
            }
            for (var j=0; j<=11; j++) {
                writeByte(std_dc_luminance_values[j]);
            }

            writeByte(0x10); // HTYACinfo
            for (var k=0; k<16; k++) {
                writeByte(std_ac_luminance_nrcodes[k+1]);
            }
            for (var l=0; l<=161; l++) {
                writeByte(std_ac_luminance_values[l]);
            }

            writeByte(1); // HTUDCinfo
            for (var m=0; m<16; m++) {
                writeByte(std_dc_chrominance_nrcodes[m+1]);
            }
            for (var n=0; n<=11; n++) {
                writeByte(std_dc_chrominance_values[n]);
            }

            writeByte(0x11); // HTUACinfo
            for (var o=0; o<16; o++) {
                writeByte(std_ac_chrominance_nrcodes[o+1]);
            }
            for (var p=0; p<=161; p++) {
                writeByte(std_ac_chrominance_values[p]);
            }
        }

        function writeSOS()
        {
            writeWord(0xFFDA); // marker
            writeWord(12); // length
            writeByte(3); // nrofcomponents
            writeByte(1); // IdY
            writeByte(0); // HTY
            writeByte(2); // IdU
            writeByte(0x11); // HTU
            writeByte(3); // IdV
            writeByte(0x11); // HTV
            writeByte(0); // Ss
            writeByte(0x3f); // Se
            writeByte(0); // Bf
        }

        function processDU(CDU, fdtbl, DC, HTDC, HTAC){
            var EOB = HTAC[0x00];
            var M16zeroes = HTAC[0xF0];
            var pos;
            const I16 = 16;
            const I63 = 63;
            const I64 = 64;
            var DU_DCT = fDCTQuant(CDU, fdtbl);
            //ZigZag reorder
            for (var j=0;j<I64;++j) {
                DU[ZigZag[j]]=DU_DCT[j];
            }
            var Diff = DU[0] - DC; DC = DU[0];
            //Encode DC
            if (Diff==0) {
                writeBits(HTDC[0]); // Diff might be 0
            } else {
                pos = 32767+Diff;
                writeBits(HTDC[category[pos]]);
                writeBits(bitcode[pos]);
            }
            //Encode ACs
            var end0pos = 63; // was const... which is crazy
            for (; (end0pos>0)&&(DU[end0pos]==0); end0pos--) {};
            //end0pos = first element in reverse order !=0
            if ( end0pos == 0) {
                writeBits(EOB);
                return DC;
            }
            var i = 1;
            var lng;
            while ( i <= end0pos ) {
                var startpos = i;
                for (; (DU[i]==0) && (i<=end0pos); ++i) {}
                var nrzeroes = i-startpos;
                if ( nrzeroes >= I16 ) {
                    lng = nrzeroes>>4;
                    for (var nrmarker=1; nrmarker <= lng; ++nrmarker)
                        writeBits(M16zeroes);
                    nrzeroes = nrzeroes&0xF;
                }
                pos = 32767+DU[i];
                writeBits(HTAC[(nrzeroes<<4)+category[pos]]);
                writeBits(bitcode[pos]);
                i++;
            }
            if ( end0pos != I63 ) {
                writeBits(EOB);
            }
            return DC;
        }

        function initCharLookupTable(){
            var sfcc = String.fromCharCode;
            for(var i=0; i < 256; i++){ ///// ACHTUNG // 255
                clt[i] = sfcc(i);
            }
        }

        this.encode = function(image,quality,toRaw) // image data object
        {
            var time_start = new Date().getTime();

            if(quality) setQuality(quality);

            // Initialize bit writer
            byteout = new Array();
            bytenew=0;
            bytepos=7;

            // Add JPEG headers
            writeWord(0xFFD8); // SOI
            writeAPP0();
            writeDQT();
            writeSOF0(image.width,image.height);
            writeDHT();
            writeSOS();

            // Encode 8x8 macroblocks
            var DCY=0;
            var DCU=0;
            var DCV=0;

            bytenew=0;
            bytepos=7;

            this.encode.displayName = "_encode_";

            var imageData = image.data;
            var width = image.width;
            var height = image.height;

            var quadWidth = width*4;
            var tripleWidth = width*3;

            var x, y = 0;
            var r, g, b;
            var start,p, col,row,pos;
            while(y < height){
                x = 0;
                while(x < quadWidth){
                start = quadWidth * y + x;
                p = start;
                col = -1;
                row = 0;

                for(pos=0; pos < 64; pos++){
                    row = pos >> 3;// /8
                    col = ( pos & 7 ) * 4; // %8
                    p = start + ( row * quadWidth ) + col;

                    if(y+row >= height){ // padding bottom
                        p-= (quadWidth*(y+1+row-height));
                    }

                    if(x+col >= quadWidth){ // padding right
                        p-= ((x+col) - quadWidth +4)
                    }

                    r = imageData[ p++ ];
                    g = imageData[ p++ ];
                    b = imageData[ p++ ];

                    /* // calculate YUV values dynamically
                    YDU[pos]=((( 0.29900)*r+( 0.58700)*g+( 0.11400)*b))-128; //-0x80
                    UDU[pos]=(((-0.16874)*r+(-0.33126)*g+( 0.50000)*b));
                    VDU[pos]=((( 0.50000)*r+(-0.41869)*g+(-0.08131)*b));
                    */

                    // use lookup table (slightly faster)
                    YDU[pos] = ((RGB_YUV_TABLE[r]             + RGB_YUV_TABLE[(g +  256)>>0] + RGB_YUV_TABLE[(b +  512)>>0]) >> 16)-128;
                    UDU[pos] = ((RGB_YUV_TABLE[(r +  768)>>0] + RGB_YUV_TABLE[(g + 1024)>>0] + RGB_YUV_TABLE[(b + 1280)>>0]) >> 16)-128;
                    VDU[pos] = ((RGB_YUV_TABLE[(r + 1280)>>0] + RGB_YUV_TABLE[(g + 1536)>>0] + RGB_YUV_TABLE[(b + 1792)>>0]) >> 16)-128;

                }

                DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
                DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
                DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
                x+=32;
                }
                y+=8;
            }

            ////////////////////////////////////////////////////////////////

            // Do the bit alignment of the EOI marker
            if ( bytepos >= 0 ) {
                var fillbits = [];
                fillbits[1] = bytepos+1;
                fillbits[0] = (1<<(bytepos+1))-1;
                writeBits(fillbits);
            }

            writeWord(0xFFD9); //EOI

            if(toRaw) {
                var len = byteout.length;
                var data = new Uint8Array(len);

                for (var i=0; i<len; i++ ) {
                    data[i] = byteout[i].charCodeAt();
                }

                //cleanup
                byteout = [];

                // benchmarking
                var duration = new Date().getTime() - time_start;
                console.log('Encoding time: '+ duration + 'ms');

                return data;
            }

            var jpegDataUri = 'data:image/jpeg;base64,' + btoa(byteout.join(''));

            byteout = [];

            // benchmarking
            var duration = new Date().getTime() - time_start;
            console.log('Encoding time: '+ duration + 'ms');

            return jpegDataUri
    }

    function setQuality(quality){
        if (quality <= 0) {
            quality = 1;
        }
        if (quality > 100) {
            quality = 100;
        }

        if(currentQuality == quality) return // don't recalc if unchanged

        var sf = 0;
        if (quality < 50) {
            sf = Math.floor(5000 / quality);
        } else {
            sf = Math.floor(200 - quality*2);
        }

        initQuantTables(sf);
        currentQuality = quality;
        console.log('Quality set to: '+quality +'%');
    }

    function init(){
        var time_start = new Date().getTime();
        if(!quality) quality = 50;
        // Create tables
        initCharLookupTable()
        initHuffmanTbl();
        initCategoryNumber();
        initRGBYUVTable();

        setQuality(quality);
        var duration = new Date().getTime() - time_start;
        console.log('Initialization '+ duration + 'ms');
    }

    init();

};

/* Example usage. Quality is an int in the range [0, 100]
function example(quality){
    // Pass in an existing image from the page
    var theImg = document.getElementById('testimage');
    // Use a canvas to extract the raw image data
    var cvs = document.createElement('canvas');
    cvs.width = theImg.width;
    cvs.height = theImg.height;
    var ctx = cvs.getContext("2d");
    ctx.drawImage(theImg,0,0);
    var theImgData = (ctx.getImageData(0, 0, cvs.width, cvs.height));
    // Encode the image and get a URI back, toRaw is false by default
    var jpegURI = encoder.encode(theImgData, quality);
    var img = document.createElement('img');
    img.src = jpegURI;
    document.body.appendChild(img);
}
Example usage for getting back raw data and transforming it to a blob.
Raw data is useful when trying to send an image over XHR or Websocket,
it uses around 30% less bytes then a Base64 encoded string. It can
also be useful if you want to save the image to disk using a FileWriter.
NOTE: The browser you are using must support Blobs
function example(quality){
    // Pass in an existing image from the page
    var theImg = document.getElementById('testimage');
    // Use a canvas to extract the raw image data
    var cvs = document.createElement('canvas');
    cvs.width = theImg.width;
    cvs.height = theImg.height;
    var ctx = cvs.getContext("2d");
    ctx.drawImage(theImg,0,0);
    var theImgData = (ctx.getImageData(0, 0, cvs.width, cvs.height));
    // Encode the image and get a URI back, set toRaw to true
    var rawData = encoder.encode(theImgData, quality, true);
    blob = new Blob([rawData.buffer], {type: 'image/jpeg'});
    var jpegURI = URL.createObjectURL(blob);
    var img = document.createElement('img');
    img.src = jpegURI;
    document.body.appendChild(img);
}*/

(function(){function c(j){var i=j.naturalWidth,l=j.naturalHeight;if(i*l>1024*1024){var k=document.createElement("canvas");k.width=k.height=1;var h=k.getContext("2d");h.drawImage(j,-i+1,0);return h.getImageData(0,0,1,1).data[3]===0}else{return false}}function e(j,h,r){var l=document.createElement("canvas");l.width=1;l.height=r;var q=l.getContext("2d");q.drawImage(j,0,0);var k=q.getImageData(0,0,1,r).data;var o=0;var m=r;var p=r;while(p>o){var i=k[(p-1)*4+3];if(i===0){m=p}else{o=p}p=(m+o)>>1}var n=(p/r);return(n===0)?1:n}function g(h,j,k){var i=document.createElement("canvas");d(h,i,j,k);return i.toDataURL("image/jpeg",j.quality||0.8)}function d(A,m,k,h){var j=A.naturalWidth,r=A.naturalHeight;if(!(j+r)){return}var u=k.width,z=k.height;var v=m.getContext("2d");v.save();b(m,v,u,z,k.orientation);var n=c(A);if(n){j/=2;r/=2}var y=1024;var i=document.createElement("canvas");i.width=i.height=y;var l=i.getContext("2d");var w=h?e(A,j,r):1;var q=Math.ceil(y*u/j);var x=Math.ceil(y*z/r/w);var s=0;var o=0;while(s<r){var t=0;var p=0;while(t<j){l.clearRect(0,0,y,y);l.drawImage(A,-t,-s);v.drawImage(i,0,0,y,y,p,o,q,x);t+=y;p+=q}s+=y;o+=x}v.restore();i=l=null}function b(i,h,k,l,j){switch(j){case 5:case 6:case 7:case 8:i.width=l;i.height=k;break;default:i.width=k;i.height=l}switch(j){case 2:h.translate(k,0);h.scale(-1,1);break;case 3:h.translate(k,l);h.rotate(Math.PI);break;case 4:h.translate(0,l);h.scale(1,-1);break;case 5:h.rotate(0.5*Math.PI);h.scale(1,-1);break;case 6:h.rotate(0.5*Math.PI);h.translate(0,-l);break;case 7:h.rotate(0.5*Math.PI);h.translate(k,-l);h.scale(-1,1);break;case 8:h.rotate(-0.5*Math.PI);h.translate(-k,0);break;default:break}}var a=window.URL&&window.URL.createObjectURL?window.URL:window.webkitURL&&window.webkitURL.createObjectURL?window.webkitURL:null;function f(j){if(window.Blob&&j instanceof Blob){if(!a){throw Error("No createObjectURL function found to create blob url")}var h=new Image();h.src=a.createObjectURL(j);this.blob=j;j=h}if(!j.naturalWidth&&!j.naturalHeight){var i=this;j.onload=j.onerror=function(){var l=i.imageLoadListeners;if(l){i.imageLoadListeners=null;for(var m=0,k=l.length;m<k;m++){l[m]()}}};this.imageLoadListeners=[]}this.srcImage=j}f.prototype.render=function(j,o,q){if(this.imageLoadListeners){var n=this;this.imageLoadListeners.push(function(){n.render(j,o,q)});return}o=o||{};var u=this.srcImage.naturalWidth,v=this.srcImage.naturalHeight,i=o.width,p=o.height,s=o.maxWidth,r=o.maxHeight,t=!this.blob||this.blob.type==="image/jpeg";if(i&&!p){p=(v*i/u)<<0}else{if(p&&!i){i=(u*p/v)<<0}else{i=u;p=v}}if(s&&i>s){i=s;p=(v*i/u)<<0}if(r&&p>r){p=r;i=(u*p/v)<<0}var h={width:i,height:p};for(var l in o){h[l]=o[l]}var m=j.tagName.toLowerCase();if(m==="img"){j.src=g(this.srcImage,h,t)}else{if(m==="canvas"){d(this.srcImage,j,h,t)}}if(typeof this.onrender==="function"){this.onrender(j)}if(q){q()}if(this.blob){this.blob=null;a.revokeObjectURL(this.srcImage.src)}};if(typeof define==="function"&&define.amd){define([],function(){return f})}else{this.MegaPixImage=f}})();
/* 浏览器检测 */
(function(e){Array.prototype.map||(Array.prototype.map=function(e,r){var a,o,i;if(null==this)throw new TypeError(" this is null or not defined");var n=Object(this),t=n.length>>>0;if("function"!=typeof e)throw new TypeError(e+" is not a function");for(r&&(a=r),o=Array(t),i=0;t>i;){var l,c;i in n&&(l=n[i],c=e.call(a,l,i,n),o[i]=c),i++}return o});var r=e.detect=function(){var e=function(){},r={browser_parsers:[{regex:"^(Opera)/(\\d+)\\.(\\d+) \\(Nintendo Wii",family_replacement:"Wii",manufacturer:"Nintendo"},{regex:"(SeaMonkey|Camino)/(\\d+)\\.(\\d+)\\.?([ab]?\\d+[a-z]*)",family_replacement:"Camino",other:!0},{regex:"(Pale[Mm]oon)/(\\d+)\\.(\\d+)\\.?(\\d+)?",family_replacement:"Pale Moon (Firefox Variant)",other:!0},{regex:"(Fennec)/(\\d+)\\.(\\d+)\\.?([ab]?\\d+[a-z]*)",family_replacement:"Firefox Mobile"},{regex:"(Fennec)/(\\d+)\\.(\\d+)(pre)",family_replacment:"Firefox Mobile"},{regex:"(Fennec)/(\\d+)\\.(\\d+)",family_replacement:"Firefox Mobile"},{regex:"Mobile.*(Firefox)/(\\d+)\\.(\\d+)",family_replacement:"Firefox Mobile"},{regex:"(Namoroka|Shiretoko|Minefield)/(\\d+)\\.(\\d+)\\.(\\d+(?:pre)?)",family_replacement:"Firefox ($1)"},{regex:"(Firefox)/(\\d+)\\.(\\d+)(a\\d+[a-z]*)",family_replacement:"Firefox Alpha"},{regex:"(Firefox)/(\\d+)\\.(\\d+)(b\\d+[a-z]*)",family_replacement:"Firefox Beta"},{regex:"(Firefox)-(?:\\d+\\.\\d+)?/(\\d+)\\.(\\d+)(a\\d+[a-z]*)",family_replacement:"Firefox Alpha"},{regex:"(Firefox)-(?:\\d+\\.\\d+)?/(\\d+)\\.(\\d+)(b\\d+[a-z]*)",family_replacement:"Firefox Beta"},{regex:"(Namoroka|Shiretoko|Minefield)/(\\d+)\\.(\\d+)([ab]\\d+[a-z]*)?",family_replacement:"Firefox ($1)"},{regex:"(Firefox).*Tablet browser (\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"MicroB",tablet:!0},{regex:"(MozillaDeveloperPreview)/(\\d+)\\.(\\d+)([ab]\\d+[a-z]*)?"},{regex:"(Flock)/(\\d+)\\.(\\d+)(b\\d+?)",family_replacement:"Flock",other:!0},{regex:"(RockMelt)/(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Rockmelt",other:!0},{regex:"(Navigator)/(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Netscape"},{regex:"(Navigator)/(\\d+)\\.(\\d+)([ab]\\d+)",family_replacement:"Netscape"},{regex:"(Netscape6)/(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Netscape"},{regex:"(MyIBrow)/(\\d+)\\.(\\d+)",family_replacement:"My Internet Browser",other:!0},{regex:"(Opera Tablet).*Version/(\\d+)\\.(\\d+)(?:\\.(\\d+))?",family_replacement:"Opera Tablet",tablet:!0},{regex:"(Opera)/.+Opera Mobi.+Version/(\\d+)\\.(\\d+)",family_replacement:"Opera Mobile"},{regex:"Opera Mobi",family_replacement:"Opera Mobile"},{regex:"(Opera Mini)/(\\d+)\\.(\\d+)",family_replacement:"Opera Mini"},{regex:"(Opera Mini)/att/(\\d+)\\.(\\d+)",family_replacement:"Opera Mini"},{regex:"(Opera)/9.80.*Version/(\\d+)\\.(\\d+)(?:\\.(\\d+))?",family_replacement:"Opera"},{regex:"(webOSBrowser)/(\\d+)\\.(\\d+)",family_replacement:"webOS"},{regex:"(webOS)/(\\d+)\\.(\\d+)",family_replacement:"webOS"},{regex:"(wOSBrowser).+TouchPad/(\\d+)\\.(\\d+)",family_replacement:"webOS TouchPad"},{regex:"(luakit)",family_replacement:"LuaKit",other:!0},{regex:"(Lightning)/(\\d+)\\.(\\d+)([ab]?\\d+[a-z]*)",family_replacement:"Lightning",other:!0},{regex:"(Firefox)/(\\d+)\\.(\\d+)\\.(\\d+(?:pre)?) \\(Swiftfox\\)",family_replacement:"Swiftfox",other:!0},{regex:"(Firefox)/(\\d+)\\.(\\d+)([ab]\\d+[a-z]*)? \\(Swiftfox\\)",family_replacement:"Swiftfox",other:!0},{regex:"rekonq",family_replacement:"Rekonq",other:!0},{regex:"(conkeror|Conkeror)/(\\d+)\\.(\\d+)\\.?(\\d+)?",family_replacement:"Conkeror",other:!0},{regex:"(konqueror)/(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Konqueror",other:!0},{regex:"(WeTab)-Browser",family_replacement:"WeTab",other:!0},{regex:"(Comodo_Dragon)/(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Comodo Dragon",other:!0},{regex:"(YottaaMonitor)",family_replacement:"Yottaa Monitor",other:!0},{regex:"(Kindle)/(\\d+)\\.(\\d+)",family_replacement:"Kindle"},{regex:"(Symphony) (\\d+).(\\d+)",family_replacement:"Symphony",other:!0},{regex:"Minimo",family_replacement:"Minimo",other:!0},{regex:"(CrMo)/(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Chrome Mobile"},{regex:"(CriOS)/(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Chrome Mobile iOS"},{regex:"(Chrome)/(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+) Mobile",family_replacement:"Chrome Mobile"},{regex:"(chromeframe)/(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Chrome Frame"},{regex:"(UC Browser)(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"UC Browser",other:!0},{regex:"(SLP Browser)/(\\d+)\\.(\\d+)",family_replacement:"Tizen Browser",other:!0},{regex:"(Epiphany)/(\\d+)\\.(\\d+).(\\d+)",family_replacement:"Epiphany",other:!0},{regex:"(SE 2\\.X) MetaSr (\\d+)\\.(\\d+)",family_replacement:"Sogou Explorer",other:!0},{regex:"(Pingdom.com_bot_version_)(\\d+)\\.(\\d+)",family_replacement:"PingdomBot",other:!0},{regex:"(facebookexternalhit)/(\\d+)\\.(\\d+)",family_replacement:"FacebookBot"},{regex:"(Twitterbot)/(\\d+)\\.(\\d+)",family_replacement:"TwitterBot"},{regex:"(AdobeAIR|Chromium|FireWeb|Jasmine|ANTGalio|Midori|Fresco|Lobo|PaleMoon|Maxthon|Lynx|OmniWeb|Dillo|Camino|Demeter|Fluid|Fennec|Shiira|Sunrise|Chrome|Flock|Netscape|Lunascape|WebPilot|NetFront|Netfront|Konqueror|SeaMonkey|Kazehakase|Vienna|Iceape|Iceweasel|IceWeasel|Iron|K-Meleon|Sleipnir|Galeon|GranParadiso|Opera Mini|iCab|NetNewsWire|ThunderBrowse|Iron|Iris|UP\\.Browser|Bunjaloo|Google Earth|Raven for Mac)/(\\d+)\\.(\\d+)\\.(\\d+)"},{regex:"(Bolt|Jasmine|IceCat|Skyfire|Midori|Maxthon|Lynx|Arora|IBrowse|Dillo|Camino|Shiira|Fennec|Phoenix|Chrome|Flock|Netscape|Lunascape|Epiphany|WebPilot|Opera Mini|Opera|NetFront|Netfront|Konqueror|Googlebot|SeaMonkey|Kazehakase|Vienna|Iceape|Iceweasel|IceWeasel|Iron|K-Meleon|Sleipnir|Galeon|GranParadiso|iCab|NetNewsWire|Iron|Space Bison|Stainless|Orca|Dolfin|BOLT|Minimo|Tizen Browser|Polaris)/(\\d+)\\.(\\d+)"},{regex:"(iRider|Crazy Browser|SkipStone|iCab|Lunascape|Sleipnir|Maemo Browser) (\\d+)\\.(\\d+)\\.(\\d+)"},{regex:"(iCab|Lunascape|Opera|Android|Jasmine|Polaris|BREW) (\\d+)\\.(\\d+)\\.?(\\d+)?"},{regex:"(Android) Donut",v2_replacement:"2",v1_replacement:"1"},{regex:"(Android) Eclair",v2_replacement:"1",v1_replacement:"2"},{regex:"(Android) Froyo",v2_replacement:"2",v1_replacement:"2"},{regex:"(Android) Gingerbread",v2_replacement:"3",v1_replacement:"2"},{regex:"(Android) Honeycomb",v1_replacement:"3"},{regex:"(IEMobile)[ /](\\d+)\\.(\\d+)",family_replacement:"IE Mobile"},{regex:"(MSIE) (\\d+)\\.(\\d+).*XBLWP7",family_replacement:"IE Large Screen"},{regex:"(Firefox)/(\\d+)\\.(\\d+)\\.(\\d+)"},{regex:"(Firefox)/(\\d+)\\.(\\d+)(pre|[ab]\\d+[a-z]*)?"},{regex:"(Obigo)InternetBrowser",other:!0},{regex:"(Obigo)\\-Browser",other:!0},{regex:"(Obigo|OBIGO)[^\\d]*(\\d+)(?:.(\\d+))?",other:!0},{regex:"(MAXTHON|Maxthon) (\\d+)\\.(\\d+)",family_replacement:"Maxthon",other:!0},{regex:"(Maxthon|MyIE2|Uzbl|Shiira)",v1_replacement:"0",other:!0},{regex:"(PLAYSTATION) (\\d+)",family_replacement:"PlayStation",manufacturer:"Sony"},{regex:"(PlayStation Portable)[^\\d]+(\\d+).(\\d+)",manufacturer:"Sony"},{regex:"(BrowseX) \\((\\d+)\\.(\\d+)\\.(\\d+)",other:!0},{regex:"(POLARIS)/(\\d+)\\.(\\d+)",family_replacement:"Polaris",other:!0},{regex:"(Embider)/(\\d+)\\.(\\d+)",family_replacement:"Polaris",other:!0},{regex:"(BonEcho)/(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Bon Echo",other:!0},{regex:"(iPod).+Version/(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Mobile Safari",manufacturer:"Apple"},{regex:"(iPod).*Version/(\\d+)\\.(\\d+)",family_replacement:"Mobile Safari",manufacturer:"Apple"},{regex:"(iPod)",family_replacement:"Mobile Safari",manufacturer:"Apple"},{regex:"(iPhone).*Version/(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Mobile Safari",manufacturer:"Apple"},{regex:"(iPhone).*Version/(\\d+)\\.(\\d+)",family_replacement:"Mobile Safari",manufacturer:"Apple"},{regex:"(iPhone)",family_replacement:"Mobile Safari",manufacturer:"Apple"},{regex:"(iPad).*Version/(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Mobile Safari",tablet:!0,manufacturer:"Apple"},{regex:"(iPad).*Version/(\\d+)\\.(\\d+)",family_replacement:"Mobile Safari",tablet:!0,manufacturer:"Apple"},{regex:"(iPad)",family_replacement:"Mobile Safari",tablet:!0,manufacturer:"Apple"},{regex:"(AvantGo) (\\d+).(\\d+)",other:!0},{regex:"(Avant)",v1_replacement:"1",other:!0},{regex:"^(Nokia)",family_replacement:"Nokia Services (WAP) Browser",manufacturer:"Nokia"},{regex:"(NokiaBrowser)/(\\d+)\\.(\\d+).(\\d+)\\.(\\d+)",manufacturer:"Nokia"},{regex:"(NokiaBrowser)/(\\d+)\\.(\\d+).(\\d+)",manufacturer:"Nokia"},{regex:"(NokiaBrowser)/(\\d+)\\.(\\d+)",manufacturer:"Nokia"},{regex:"(BrowserNG)/(\\d+)\\.(\\d+).(\\d+)",family_replacement:"NokiaBrowser",manufacturer:"Nokia"},{regex:"(Series60)/5\\.0",v2_replacement:"0",v1_replacement:"7",family_replacement:"NokiaBrowser",manufacturer:"Nokia"},{regex:"(Series60)/(\\d+)\\.(\\d+)",family_replacement:"Nokia OSS Browser",manufacturer:"Nokia"},{regex:"(S40OviBrowser)/(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Nokia Series 40 Ovi Browser",manufacturer:"Nokia"},{regex:"(Nokia)[EN]?(\\d+)",manufacturer:"Nokia"},{regex:"(PlayBook).+RIM Tablet OS (\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Blackberry WebKit",tablet:!0,manufacturer:"Nokia"},{regex:"(Black[bB]erry).+Version/(\\d+)\\.(\\d+)\\.(\\d+)",family_replacement:"Blackberry WebKit",manufacturer:"RIM"},{regex:"(Black[bB]erry)\\s?(\\d+)",family_replacement:"Blackberry",manufacturer:"RIM"},{regex:"(OmniWeb)/v(\\d+)\\.(\\d+)",other:!0},{regex:"(Blazer)/(\\d+)\\.(\\d+)",family_replacement:"Palm Blazer",manufacturer:"Palm"},{regex:"(Pre)/(\\d+)\\.(\\d+)",family_replacement:"Palm Pre",manufacturer:"Palm"},{regex:"(Links) \\((\\d+)\\.(\\d+)",other:!0},{regex:"(QtWeb) Internet Browser/(\\d+)\\.(\\d+)",other:!0},{regex:"(Silk)/(\\d+)\\.(\\d+)(?:\\.([0-9\\-]+))?",other:!0,tablet:!0},{regex:"(AppleWebKit)/(\\d+)\\.?(\\d+)?\\+ .* Version/\\d+\\.\\d+.\\d+ Safari/",family_replacement:"WebKit Nightly"},{regex:"(Version)/(\\d+)\\.(\\d+)(?:\\.(\\d+))?.*Safari/",family_replacement:"Safari"},{regex:"(Safari)/\\d+"},{regex:"(OLPC)/Update(\\d+)\\.(\\d+)",other:!0},{regex:"(OLPC)/Update()\\.(\\d+)",v1_replacement:"0",other:!0},{regex:"(SEMC\\-Browser)/(\\d+)\\.(\\d+)",other:!0},{regex:"(Teleca)",family_replacement:"Teleca Browser",other:!0},{regex:"Trident(.*)rv.(\\d+)\\.(\\d+)",family_replacement:"IE"},{regex:"(MSIE) (\\d+)\\.(\\d+)",family_replacement:"IE"}],os_parsers:[{regex:"(Android) (\\d+)\\.(\\d+)(?:[.\\-]([a-z0-9]+))?"},{regex:"(Android)\\-(\\d+)\\.(\\d+)(?:[.\\-]([a-z0-9]+))?"},{regex:"(Android) Donut",os_v2_replacement:"2",os_v1_replacement:"1"},{regex:"(Android) Eclair",os_v2_replacement:"1",os_v1_replacement:"2"},{regex:"(Android) Froyo",os_v2_replacement:"2",os_v1_replacement:"2"},{regex:"(Android) Gingerbread",os_v2_replacement:"3",os_v1_replacement:"2"},{regex:"(Android) Honeycomb",os_v1_replacement:"3"},{regex:"(Silk-Accelerated=[a-z]{4,5})",os_replacement:"Android"},{regex:"(Windows Phone 6\\.5)"},{regex:"(Windows (?:NT 5\\.2|NT 5\\.1))",os_replacement:"Windows XP"},{regex:"(XBLWP7)",os_replacement:"Windows Phone OS"},{regex:"(Windows NT 6\\.1)",os_replacement:"Windows 7"},{regex:"(Windows NT 6\\.0)",os_replacement:"Windows Vista"},{regex:"(Windows 98|Windows XP|Windows ME|Windows 95|Windows CE|Windows 7|Windows NT 4\\.0|Windows Vista|Windows 2000)"},{regex:"(Windows NT 6\\.2)",os_replacement:"Windows 8"},{regex:"(Windows Phone 8)",os_replacement:"Windows Phone 8"},{regex:"(Windows NT 5\\.0)",os_replacement:"Windows 2000"},{regex:"(Windows Phone OS) (\\d+)\\.(\\d+)"},{regex:"(Windows ?Mobile)",os_replacement:"Windows Mobile"},{regex:"(WinNT4.0)",os_replacement:"Windows NT 4.0"},{regex:"(Win98)",os_replacement:"Windows 98"},{regex:"(Tizen)/(\\d+)\\.(\\d+)",other:!0},{regex:"(Mac OS X) (\\d+)[_.](\\d+)(?:[_.](\\d+))?",manufacturer:"Apple"},{regex:"(?:PPC|Intel) (Mac OS X)",manufacturer:"Apple"},{regex:"(CPU OS|iPhone OS) (\\d+)_(\\d+)(?:_(\\d+))?",os_replacement:"iOS",manufacturer:"Apple"},{regex:"(iPhone|iPad|iPod); Opera",os_replacement:"iOS",manufacturer:"Apple"},{regex:"(iPad); Opera",tablet:!0,manufacturer:"Apple"},{regex:"(iPhone|iPad|iPod).*Mac OS X.*Version/(\\d+)\\.(\\d+)",os_replacement:"iOS",manufacturer:"Apple"},{regex:"(CrOS) [a-z0-9_]+ (\\d+)\\.(\\d+)(?:\\.(\\d+))?",os_replacement:"Chrome OS"},{regex:"(Debian)-(\\d+)\\.(\\d+)\\.(\\d+)(?:\\.(\\d+))?",other:!0},{regex:"(Linux Mint)(?:/(\\d+))?",other:!0},{regex:"(Mandriva)(?: Linux)?/(\\d+)\\.(\\d+)\\.(\\d+)(?:\\.(\\d+))?",other:!0},{regex:"(Symbian[Oo][Ss])/(\\d+)\\.(\\d+)",os_replacement:"Symbian OS"},{regex:"(Symbian/3).+NokiaBrowser/7\\.3",os_replacement:"Symbian^3 Anna"},{regex:"(Symbian/3).+NokiaBrowser/7\\.4",os_replacement:"Symbian^3 Belle"},{regex:"(Symbian/3)",os_replacement:"Symbian^3"},{regex:"(Series 60|SymbOS|S60)",os_replacement:"Symbian OS"},{regex:"(MeeGo)",other:!0},{regex:"Symbian [Oo][Ss]",os_replacement:"Symbian OS"},{regex:"(Black[Bb]erry)[0-9a-z]+/(\\d+)\\.(\\d+)\\.(\\d+)(?:\\.(\\d+))?",os_replacement:"BlackBerry OS",manufacturer:"RIM"},{regex:"(Black[Bb]erry).+Version/(\\d+)\\.(\\d+)\\.(\\d+)(?:\\.(\\d+))?",os_replacement:"BlackBerry OS",manufacturer:"RIM"},{regex:"(RIM Tablet OS) (\\d+)\\.(\\d+)\\.(\\d+)",os_replacement:"BlackBerry Tablet OS",tablet:!0,manufacturer:"RIM"},{regex:"(Play[Bb]ook)",os_replacement:"BlackBerry Tablet OS",tablet:!0,manufacturer:"RIM"},{regex:"(Black[Bb]erry)",os_replacement:"Blackberry OS",manufacturer:"RIM"},{regex:"(webOS|hpwOS)/(\\d+)\\.(\\d+)(?:\\.(\\d+))?",os_replacement:"webOS"},{regex:"(SUSE|Fedora|Red Hat|PCLinuxOS)/(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+)",other:!0},{regex:"(SUSE|Fedora|Red Hat|Puppy|PCLinuxOS|CentOS)/(\\d+)\\.(\\d+)\\.(\\d+)",other:!0},{regex:"(Ubuntu|Kindle|Bada|Lubuntu|BackTrack|Red Hat|Slackware)/(\\d+)\\.(\\d+)"},{regex:"(Windows|OpenBSD|FreeBSD|NetBSD|Ubuntu|Kubuntu|Android|Arch Linux|CentOS|WeTab|Slackware)"},{regex:"(Linux|BSD)",other:!0}],mobile_os_families:["Windows Phone 6.5","Windows CE","Symbian OS"],device_parsers:[{regex:"HTC ([A-Z][a-z0-9]+) Build",device_replacement:"HTC $1",manufacturer:"HTC"},{regex:"HTC ([A-Z][a-z0-9 ]+) \\d+\\.\\d+\\.\\d+\\.\\d+",device_replacement:"HTC $1",manufacturer:"HTC"},{regex:"HTC_Touch_([A-Za-z0-9]+)",device_replacement:"HTC Touch ($1)",manufacturer:"HTC"},{regex:"USCCHTC(\\d+)",device_replacement:"HTC $1 (US Cellular)",manufacturer:"HTC"},{regex:"Sprint APA(9292)",device_replacement:"HTC $1 (Sprint)",manufacturer:"HTC"},{regex:"HTC ([A-Za-z0-9]+ [A-Z])",device_replacement:"HTC $1",manufacturer:"HTC"},{regex:"HTC-([A-Za-z0-9]+)",device_replacement:"HTC $1",manufacturer:"HTC"},{regex:"HTC_([A-Za-z0-9]+)",device_replacement:"HTC $1",manufacturer:"HTC"},{regex:"HTC ([A-Za-z0-9]+)",device_replacement:"HTC $1",manufacturer:"HTC"},{regex:"(ADR[A-Za-z0-9]+)",device_replacement:"HTC $1",manufacturer:"HTC"},{regex:"(HTC)",manufacturer:"HTC"},{regex:"SonyEricsson([A-Za-z0-9]+)/",device_replacement:"Ericsson $1",other:!0,manufacturer:"Sony"},{regex:"Android[\\- ][\\d]+\\.[\\d]+\\; [A-Za-z]{2}\\-[A-Za-z]{2}\\; WOWMobile (.+) Build"},{regex:"Android[\\- ][\\d]+\\.[\\d]+\\.[\\d]+; [A-Za-z]{2}\\-[A-Za-z]{2}\\; (.+) Build"},{regex:"Android[\\- ][\\d]+\\.[\\d]+\\-update1\\; [A-Za-z]{2}\\-[A-Za-z]{2}\\; (.+) Build"},{regex:"Android[\\- ][\\d]+\\.[\\d]+\\; [A-Za-z]{2}\\-[A-Za-z]{2}\\; (.+) Build"},{regex:"Android[\\- ][\\d]+\\.[\\d]+\\.[\\d]+; (.+) Build"},{regex:"NokiaN([0-9]+)",device_replacement:"Nokia N$1",manufacturer:"Nokia"},{regex:"Nokia([A-Za-z0-9\\v-]+)",device_replacement:"Nokia $1",manufacturer:"Nokia"},{regex:"NOKIA ([A-Za-z0-9\\-]+)",device_replacement:"Nokia $1",manufacturer:"Nokia"},{regex:"Nokia ([A-Za-z0-9\\-]+)",device_replacement:"Nokia $1",manufacturer:"Nokia"},{regex:"Lumia ([A-Za-z0-9\\-]+)",device_replacement:"Lumia $1",manufacturer:"Nokia"},{regex:"Symbian",device_replacement:"Nokia",manufacturer:"Nokia"},{regex:"(PlayBook).+RIM Tablet OS",device_replacement:"Blackberry Playbook",tablet:!0,manufacturer:"RIM"},{regex:"(Black[Bb]erry [0-9]+);",manufacturer:"RIM"},{regex:"Black[Bb]erry([0-9]+)",device_replacement:"BlackBerry $1",manufacturer:"RIM"},{regex:"(Pre)/(\\d+)\\.(\\d+)",device_replacement:"Palm Pre",manufacturer:"Palm"},{regex:"(Pixi)/(\\d+)\\.(\\d+)",device_replacement:"Palm Pixi",manufacturer:"Palm"},{regex:"(Touchpad)/(\\d+)\\.(\\d+)",device_replacement:"HP Touchpad",manufacturer:"HP"},{regex:"HPiPAQ([A-Za-z0-9]+)/(\\d+).(\\d+)",device_replacement:"HP iPAQ $1",manufacturer:"HP"},{regex:"Palm([A-Za-z0-9]+)",device_replacement:"Palm $1",manufacturer:"Palm"},{regex:"Treo([A-Za-z0-9]+)",device_replacement:"Palm Treo $1",manufacturer:"Palm"},{regex:"webOS.*(P160UNA)/(\\d+).(\\d+)",device_replacement:"HP Veer",manufacturer:"HP"},{regex:"(Kindle Fire)",manufacturer:"Amazon"},{regex:"(Kindle)",manufacturer:"Amazon"},{regex:"(Silk)/(\\d+)\\.(\\d+)(?:\\.([0-9\\-]+))?",device_replacement:"Kindle Fire",tablet:!0,manufacturer:"Amazon"},{regex:"(iPad) Simulator;",manufacturer:"Apple"},{regex:"(iPad);",manufacturer:"Apple"},{regex:"(iPod);",manufacturer:"Apple"},{regex:"(iPhone) Simulator;",manufacturer:"Apple"},{regex:"(iPhone);",manufacturer:"Apple"},{regex:"Nexus\\ ([A-Za-z0-9\\-]+)",device_replacement:"Nexus $1"},{regex:"acer_([A-Za-z0-9]+)_",device_replacement:"Acer $1",manufacturer:"Acer"},{regex:"acer_([A-Za-z0-9]+)_",device_replacement:"Acer $1",manufacturer:"Acer"},{regex:"Amoi\\-([A-Za-z0-9]+)",device_replacement:"Amoi $1",other:!0,manufacturer:"Amoi"},{regex:"AMOI\\-([A-Za-z0-9]+)",device_replacement:"Amoi $1",other:!0,manufacturer:"Amoi"},{regex:"Asus\\-([A-Za-z0-9]+)",device_replacement:"Asus $1",manufacturer:"Asus"},{regex:"ASUS\\-([A-Za-z0-9]+)",device_replacement:"Asus $1",manufacturer:"Asus"},{regex:"BIRD\\-([A-Za-z0-9]+)",device_replacement:"Bird $1",other:!0},{regex:"BIRD\\.([A-Za-z0-9]+)",device_replacement:"Bird $1",other:!0},{regex:"BIRD ([A-Za-z0-9]+)",device_replacement:"Bird $1",other:!0},{regex:"Dell ([A-Za-z0-9]+)",device_replacement:"Dell $1",manufacturer:"Dell"},{regex:"DoCoMo/2\\.0 ([A-Za-z0-9]+)",device_replacement:"DoCoMo $1",other:!0},{regex:"([A-Za-z0-9]+)\\_W\\;FOMA",device_replacement:"DoCoMo $1",other:!0},{regex:"([A-Za-z0-9]+)\\;FOMA",device_replacement:"DoCoMo $1",other:!0},{regex:"vodafone([A-Za-z0-9]+)",device_replacement:"Huawei Vodafone $1",other:!0},{regex:"i\\-mate ([A-Za-z0-9]+)",device_replacement:"i-mate $1",other:!0},{regex:"Kyocera\\-([A-Za-z0-9]+)",device_replacement:"Kyocera $1",other:!0},{regex:"KWC\\-([A-Za-z0-9]+)",device_replacement:"Kyocera $1",other:!0},{regex:"Lenovo\\-([A-Za-z0-9]+)",device_replacement:"Lenovo $1",manufacturer:"Lenovo"},{regex:"Lenovo\\_([A-Za-z0-9]+)",device_replacement:"Lenovo $1",manufacturer:"Levovo"},{regex:"LG/([A-Za-z0-9]+)",device_replacement:"LG $1",manufacturer:"LG"},{regex:"LG-LG([A-Za-z0-9]+)",device_replacement:"LG $1",manufacturer:"LG"},{regex:"LGE-LG([A-Za-z0-9]+)",device_replacement:"LG $1",manufacturer:"LG"},{regex:"LGE VX([A-Za-z0-9]+)",device_replacement:"LG $1",manufacturer:"LG"},{regex:"LG ([A-Za-z0-9]+)",device_replacement:"LG $1",manufacturer:"LG"},{regex:"LGE LG\\-AX([A-Za-z0-9]+)",device_replacement:"LG $1",manufacturer:"LG"},{regex:"LG\\-([A-Za-z0-9]+)",device_replacement:"LG $1",manufacturer:"LG"},{regex:"LGE\\-([A-Za-z0-9]+)",device_replacement:"LG $1",manufacturer:"LG"},{regex:"LG([A-Za-z0-9]+)",device_replacement:"LG $1",manufacturer:"LG"},{regex:"(KIN)\\.One (\\d+)\\.(\\d+)",device_replacement:"Microsoft $1"},{regex:"(KIN)\\.Two (\\d+)\\.(\\d+)",device_replacement:"Microsoft $1"},{regex:"(Motorola)\\-([A-Za-z0-9]+)",manufacturer:"Motorola"},{regex:"MOTO\\-([A-Za-z0-9]+)",device_replacement:"Motorola $1",manufacturer:"Motorola"},{regex:"MOT\\-([A-Za-z0-9]+)",device_replacement:"Motorola $1",manufacturer:"Motorola"},{regex:"Philips([A-Za-z0-9]+)",device_replacement:"Philips $1",manufacturer:"Philips"},{regex:"Philips ([A-Za-z0-9]+)",device_replacement:"Philips $1",manufacturer:"Philips"},{regex:"SAMSUNG-([A-Za-z0-9\\-]+)",device_replacement:"Samsung $1",manufacturer:"Samsung"},{regex:"SAMSUNG\\; ([A-Za-z0-9\\-]+)",device_replacement:"Samsung $1",manufacturer:"Samsung"},{regex:"Softbank/1\\.0/([A-Za-z0-9]+)",device_replacement:"Softbank $1",other:!0},{regex:"Softbank/2\\.0/([A-Za-z0-9]+)",device_replacement:"Softbank $1",other:!0},{regex:"(hiptop|avantgo|plucker|xiino|blazer|elaine|up.browser|up.link|mmp|smartphone|midp|wap|vodafone|o2|pocket|mobile|pda)",device_replacement:"Generic Smartphone"},{regex:"^(1207|3gso|4thp|501i|502i|503i|504i|505i|506i|6310|6590|770s|802s|a wa|acer|acs\\-|airn|alav|asus|attw|au\\-m|aur |aus |abac|acoo|aiko|alco|alca|amoi|anex|anny|anyw|aptu|arch|argo|bell|bird|bw\\-n|bw\\-u|beck|benq|bilb|blac|c55/|cdm\\-|chtm|capi|comp|cond|craw|dall|dbte|dc\\-s|dica|ds\\-d|ds12|dait|devi|dmob|doco|dopo|el49|erk0|esl8|ez40|ez60|ez70|ezos|ezze|elai|emul|eric|ezwa|fake|fly\\-|fly\\_|g\\-mo|g1 u|g560|gf\\-5|grun|gene|go.w|good|grad|hcit|hd\\-m|hd\\-p|hd\\-t|hei\\-|hp i|hpip|hs\\-c|htc |htc\\-|htca|htcg)",device_replacement:"Generic Feature Phone"},{regex:"^(htcp|htcs|htct|htc\\_|haie|hita|huaw|hutc|i\\-20|i\\-go|i\\-ma|i230|iac|iac\\-|iac/|ig01|im1k|inno|iris|jata|java|kddi|kgt|kgt/|kpt |kwc\\-|klon|lexi|lg g|lg\\-a|lg\\-b|lg\\-c|lg\\-d|lg\\-f|lg\\-g|lg\\-k|lg\\-l|lg\\-m|lg\\-o|lg\\-p|lg\\-s|lg\\-t|lg\\-u|lg\\-w|lg/k|lg/l|lg/u|lg50|lg54|lge\\-|lge/|lynx|leno|m1\\-w|m3ga|m50/|maui|mc01|mc21|mcca|medi|meri|mio8|mioa|mo01|mo02|mode|modo|mot |mot\\-|mt50|mtp1|mtv |mate|maxo|merc|mits|mobi|motv|mozz|n100|n101|n102|n202|n203|n300|n302|n500|n502|n505|n700|n701|n710|nec\\-|nem\\-|newg|neon)",device_replacement:"Generic Feature Phone"},{regex:"^(netf|noki|nzph|o2 x|o2\\-x|opwv|owg1|opti|oran|ot\\-s|p800|pand|pg\\-1|pg\\-2|pg\\-3|pg\\-6|pg\\-8|pg\\-c|pg13|phil|pn\\-2|pt\\-g|palm|pana|pire|pock|pose|psio|qa\\-a|qc\\-2|qc\\-3|qc\\-5|qc\\-7|qc07|qc12|qc21|qc32|qc60|qci\\-|qwap|qtek|r380|r600|raks|rim9|rove|s55/|sage|sams|sc01|sch\\-|scp\\-|sdk/|se47|sec\\-|sec0|sec1|semc|sgh\\-|shar|sie\\-|sk\\-0|sl45|slid|smb3|smt5|sp01|sph\\-|spv |spv\\-|sy01|samm|sany|sava|scoo|send|siem|smar|smit|soft|sony|t\\-mo|t218|t250|t600|t610|t618|tcl\\-|tdg\\-|telm|tim\\-|ts70|tsm\\-|tsm3|tsm5|tx\\-9|tagt)",device_replacement:"Generic Feature Phone"},{regex:"^(talk|teli|topl|tosh|up.b|upg1|utst|v400|v750|veri|vk\\-v|vk40|vk50|vk52|vk53|vm40|vx98|virg|vite|voda|vulc|w3c |w3c\\-|wapj|wapp|wapu|wapm|wig |wapi|wapr|wapv|wapy|wapa|waps|wapt|winc|winw|wonu|x700|xda2|xdag|yas\\-|your|zte\\-|zeto|aste|audi|avan|blaz|brew|brvw|bumb|ccwa|cell|cldc|cmd\\-|dang|eml2|fetc|hipt|http|ibro|idea|ikom|ipaq|jbro|jemu|jigs|keji|kyoc|kyok|libw|m\\-cr|midp|mmef|moto|mwbp|mywa|newt|nok6|o2im|pant|pdxg|play|pluc|port|prox|rozo|sama|seri|smal|symb|treo|upsi|vx52|vx53|vx60|vx61|vx70|vx80|vx81|vx83|vx85|wap\\-|webc|whit|wmlb|xda\\-|xda\\_)",device_replacement:"Generic Feature Phone"},{regex:"(bot|borg|google(^tv)|yahoo|slurp|msnbot|msrbot|openbot|archiver|netresearch|lycos|scooter|altavista|teoma|gigabot|baiduspider|blitzbot|oegp|charlotte|furlbot|http%20client|polybot|htdig|ichiro|mogimogi|larbin|pompos|scrubby|searchsight|seekbot|semanticdiscovery|silk|snappy|speedy|spider|voila|vortex|voyager|zao|zeal|fast\\-webcrawler|converacrawler|dataparksearch|findlinks)",device_replacement:"Spider"}],mobile_browser_families:["Firefox Mobile","Opera Mobile","Opera Mini","Mobile Safari","webOS","IE Mobile","Playstation Portable","Nokia","Blackberry","Palm","Silk","Android","Maemo","Obigo","Netfront","AvantGo","Teleca","SEMC-Browser","Bolt","Iris","UP.Browser","Symphony","Minimo","Bunjaloo","Jasmine","Dolfin","Polaris","BREW","Chrome Mobile","Chrome Mobile iOS","UC Browser","Tizen Browser"]};e.parsers=["device_parsers","browser_parsers","os_parsers","mobile_os_families","mobile_browser_families"],e.types=["browser","os","device"],e.regexes=r||function(){var r={};return e.parsers.map(function(e){r[e]=[]}),r}(),e.families=function(){var r={};return e.types.map(function(e){r[e]=[]}),r}();var a=Array.prototype,o=(Object.prototype,Function.prototype,a.forEach);a.indexOf;var i=function(e,r){for(var a={},o=0;r.length>o&&!(a=r[o](e));o++);return a},n=function(e,r){t(e,function(e){t(r,function(r){delete e[r]})})},t=forEach=function(e,r,a){if(null!=e)if(o&&e.forEach===o)e.forEach(r,a);else if(e.length===+e.length)for(var i=0,n=e.length;n>i;i++)r.call(a,e[i],i,e);else for(var t in e)_.has(e,t)&&r.call(a,e[t],t,e)},l=function(e){return!(!e||e===undefined||null==e)},c=function(e){var r="";return e=e||{},l(e)&&l(e.major)&&(r+=e.major,l(e.minor)&&(r+="."+e.minor,l(e.patch)&&(r+="."+e.patch))),r},d=function(e){e=e||{};var r=c(e);return r&&(r=" "+r),e&&l(e.family)?e.family+r:""};return e.parse=function(r){var a=function(r){return e.regexes[r+"_parsers"].map(function(e){function a(r){var a=r.match(o);if(!a)return null;var t={};return t.family=(i?i.replace("$1",a[1]):a[1])||"other",t.major=parseInt(n?n:a[2])||null,t.minor=a[3]?parseInt(a[3]):null,t.patch=a[4]?parseInt(a[4]):null,t.tablet=e.tablet,t.man=e.manufacturer||null,t}var o=RegExp(e.regex),i=e[("browser"===r?"family":r)+"_replacement"],n=e.major_version_replacement;return a})},o=function(){},t=a("browser"),m=a("os"),p=a("device"),s=new o;s.source=r,s.browser=i(r,t),l(s.browser)?(s.browser.name=d(s.browser),s.browser.version=c(s.browser)):s.browser={},s.os=i(r,m),l(s.os)?(s.os.name=d(s.os),s.os.version=c(s.os)):s.os={},s.device=i(r,p),l(s.device)?(s.device.name=d(s.device),s.device.version=c(s.device)):s.device={tablet:!1,family:"Other"};var g={};return e.regexes.mobile_browser_families.map(function(e){g[e]=!0}),e.regexes.mobile_os_families.map(function(e){g[e]=!0}),s.device.type="Spider"===s.browser.family?"Spider":s.browser.tablet||s.os.tablet||s.device.tablet?"Tablet":g.hasOwnProperty(s.browser.family)?"Mobile":"Desktop",s.device.manufacturer=s.browser.man||s.os.man||s.device.man||null,n([s.browser,s.os,s.device],["tablet","man"]),s},e}();"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=r),exports.detect=r):e.detect=r,"function"==typeof define&&define.amd&&define(function(){return r})})(window);

/* exif */
(function() {

    var debug = false;

    var root = this;

    var EXIF = function(obj) {
        if (obj instanceof EXIF) return obj;
        if (!(this instanceof EXIF)) return new EXIF(obj);
        this.EXIFwrapped = obj;
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = EXIF;
        }
        exports.EXIF = EXIF;
    } else {
        root.EXIF = EXIF;
    }

    var ExifTags = EXIF.Tags = {

        // version tags
        0x9000 : "ExifVersion",             // EXIF version
        0xA000 : "FlashpixVersion",         // Flashpix format version

        // colorspace tags
        0xA001 : "ColorSpace",              // Color space information tag

        // image configuration
        0xA002 : "PixelXDimension",         // Valid width of meaningful image
        0xA003 : "PixelYDimension",         // Valid height of meaningful image
        0x9101 : "ComponentsConfiguration", // Information about channels
        0x9102 : "CompressedBitsPerPixel",  // Compressed bits per pixel

        // user information
        0x927C : "MakerNote",               // Any desired information written by the manufacturer
        0x9286 : "UserComment",             // Comments by user

        // related file
        0xA004 : "RelatedSoundFile",        // Name of related sound file

        // date and time
        0x9003 : "DateTimeOriginal",        // Date and time when the original image was generated
        0x9004 : "DateTimeDigitized",       // Date and time when the image was stored digitally
        0x9290 : "SubsecTime",              // Fractions of seconds for DateTime
        0x9291 : "SubsecTimeOriginal",      // Fractions of seconds for DateTimeOriginal
        0x9292 : "SubsecTimeDigitized",     // Fractions of seconds for DateTimeDigitized

        // picture-taking conditions
        0x829A : "ExposureTime",            // Exposure time (in seconds)
        0x829D : "FNumber",                 // F number
        0x8822 : "ExposureProgram",         // Exposure program
        0x8824 : "SpectralSensitivity",     // Spectral sensitivity
        0x8827 : "ISOSpeedRatings",         // ISO speed rating
        0x8828 : "OECF",                    // Optoelectric conversion factor
        0x9201 : "ShutterSpeedValue",       // Shutter speed
        0x9202 : "ApertureValue",           // Lens aperture
        0x9203 : "BrightnessValue",         // Value of brightness
        0x9204 : "ExposureBias",            // Exposure bias
        0x9205 : "MaxApertureValue",        // Smallest F number of lens
        0x9206 : "SubjectDistance",         // Distance to subject in meters
        0x9207 : "MeteringMode",            // Metering mode
        0x9208 : "LightSource",             // Kind of light source
        0x9209 : "Flash",                   // Flash status
        0x9214 : "SubjectArea",             // Location and area of main subject
        0x920A : "FocalLength",             // Focal length of the lens in mm
        0xA20B : "FlashEnergy",             // Strobe energy in BCPS
        0xA20C : "SpatialFrequencyResponse",    //
        0xA20E : "FocalPlaneXResolution",   // Number of pixels in width direction per FocalPlaneResolutionUnit
        0xA20F : "FocalPlaneYResolution",   // Number of pixels in height direction per FocalPlaneResolutionUnit
        0xA210 : "FocalPlaneResolutionUnit",    // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
        0xA214 : "SubjectLocation",         // Location of subject in image
        0xA215 : "ExposureIndex",           // Exposure index selected on camera
        0xA217 : "SensingMethod",           // Image sensor type
        0xA300 : "FileSource",              // Image source (3 == DSC)
        0xA301 : "SceneType",               // Scene type (1 == directly photographed)
        0xA302 : "CFAPattern",              // Color filter array geometric pattern
        0xA401 : "CustomRendered",          // Special processing
        0xA402 : "ExposureMode",            // Exposure mode
        0xA403 : "WhiteBalance",            // 1 = auto white balance, 2 = manual
        0xA404 : "DigitalZoomRation",       // Digital zoom ratio
        0xA405 : "FocalLengthIn35mmFilm",   // Equivalent foacl length assuming 35mm film camera (in mm)
        0xA406 : "SceneCaptureType",        // Type of scene
        0xA407 : "GainControl",             // Degree of overall image gain adjustment
        0xA408 : "Contrast",                // Direction of contrast processing applied by camera
        0xA409 : "Saturation",              // Direction of saturation processing applied by camera
        0xA40A : "Sharpness",               // Direction of sharpness processing applied by camera
        0xA40B : "DeviceSettingDescription",    //
        0xA40C : "SubjectDistanceRange",    // Distance to subject

        // other tags
        0xA005 : "InteroperabilityIFDPointer",
        0xA420 : "ImageUniqueID"            // Identifier assigned uniquely to each image
    };

    var TiffTags = EXIF.TiffTags = {
        0x0100 : "ImageWidth",
        0x0101 : "ImageHeight",
        0x8769 : "ExifIFDPointer",
        0x8825 : "GPSInfoIFDPointer",
        0xA005 : "InteroperabilityIFDPointer",
        0x0102 : "BitsPerSample",
        0x0103 : "Compression",
        0x0106 : "PhotometricInterpretation",
        0x0112 : "Orientation",
        0x0115 : "SamplesPerPixel",
        0x011C : "PlanarConfiguration",
        0x0212 : "YCbCrSubSampling",
        0x0213 : "YCbCrPositioning",
        0x011A : "XResolution",
        0x011B : "YResolution",
        0x0128 : "ResolutionUnit",
        0x0111 : "StripOffsets",
        0x0116 : "RowsPerStrip",
        0x0117 : "StripByteCounts",
        0x0201 : "JPEGInterchangeFormat",
        0x0202 : "JPEGInterchangeFormatLength",
        0x012D : "TransferFunction",
        0x013E : "WhitePoint",
        0x013F : "PrimaryChromaticities",
        0x0211 : "YCbCrCoefficients",
        0x0214 : "ReferenceBlackWhite",
        0x0132 : "DateTime",
        0x010E : "ImageDescription",
        0x010F : "Make",
        0x0110 : "Model",
        0x0131 : "Software",
        0x013B : "Artist",
        0x8298 : "Copyright"
    };

    var GPSTags = EXIF.GPSTags = {
        0x0000 : "GPSVersionID",
        0x0001 : "GPSLatitudeRef",
        0x0002 : "GPSLatitude",
        0x0003 : "GPSLongitudeRef",
        0x0004 : "GPSLongitude",
        0x0005 : "GPSAltitudeRef",
        0x0006 : "GPSAltitude",
        0x0007 : "GPSTimeStamp",
        0x0008 : "GPSSatellites",
        0x0009 : "GPSStatus",
        0x000A : "GPSMeasureMode",
        0x000B : "GPSDOP",
        0x000C : "GPSSpeedRef",
        0x000D : "GPSSpeed",
        0x000E : "GPSTrackRef",
        0x000F : "GPSTrack",
        0x0010 : "GPSImgDirectionRef",
        0x0011 : "GPSImgDirection",
        0x0012 : "GPSMapDatum",
        0x0013 : "GPSDestLatitudeRef",
        0x0014 : "GPSDestLatitude",
        0x0015 : "GPSDestLongitudeRef",
        0x0016 : "GPSDestLongitude",
        0x0017 : "GPSDestBearingRef",
        0x0018 : "GPSDestBearing",
        0x0019 : "GPSDestDistanceRef",
        0x001A : "GPSDestDistance",
        0x001B : "GPSProcessingMethod",
        0x001C : "GPSAreaInformation",
        0x001D : "GPSDateStamp",
        0x001E : "GPSDifferential"
    };

    var StringValues = EXIF.StringValues = {
        ExposureProgram : {
            0 : "Not defined",
            1 : "Manual",
            2 : "Normal program",
            3 : "Aperture priority",
            4 : "Shutter priority",
            5 : "Creative program",
            6 : "Action program",
            7 : "Portrait mode",
            8 : "Landscape mode"
        },
        MeteringMode : {
            0 : "Unknown",
            1 : "Average",
            2 : "CenterWeightedAverage",
            3 : "Spot",
            4 : "MultiSpot",
            5 : "Pattern",
            6 : "Partial",
            255 : "Other"
        },
        LightSource : {
            0 : "Unknown",
            1 : "Daylight",
            2 : "Fluorescent",
            3 : "Tungsten (incandescent light)",
            4 : "Flash",
            9 : "Fine weather",
            10 : "Cloudy weather",
            11 : "Shade",
            12 : "Daylight fluorescent (D 5700 - 7100K)",
            13 : "Day white fluorescent (N 4600 - 5400K)",
            14 : "Cool white fluorescent (W 3900 - 4500K)",
            15 : "White fluorescent (WW 3200 - 3700K)",
            17 : "Standard light A",
            18 : "Standard light B",
            19 : "Standard light C",
            20 : "D55",
            21 : "D65",
            22 : "D75",
            23 : "D50",
            24 : "ISO studio tungsten",
            255 : "Other"
        },
        Flash : {
            0x0000 : "Flash did not fire",
            0x0001 : "Flash fired",
            0x0005 : "Strobe return light not detected",
            0x0007 : "Strobe return light detected",
            0x0009 : "Flash fired, compulsory flash mode",
            0x000D : "Flash fired, compulsory flash mode, return light not detected",
            0x000F : "Flash fired, compulsory flash mode, return light detected",
            0x0010 : "Flash did not fire, compulsory flash mode",
            0x0018 : "Flash did not fire, auto mode",
            0x0019 : "Flash fired, auto mode",
            0x001D : "Flash fired, auto mode, return light not detected",
            0x001F : "Flash fired, auto mode, return light detected",
            0x0020 : "No flash function",
            0x0041 : "Flash fired, red-eye reduction mode",
            0x0045 : "Flash fired, red-eye reduction mode, return light not detected",
            0x0047 : "Flash fired, red-eye reduction mode, return light detected",
            0x0049 : "Flash fired, compulsory flash mode, red-eye reduction mode",
            0x004D : "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",
            0x004F : "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",
            0x0059 : "Flash fired, auto mode, red-eye reduction mode",
            0x005D : "Flash fired, auto mode, return light not detected, red-eye reduction mode",
            0x005F : "Flash fired, auto mode, return light detected, red-eye reduction mode"
        },
        SensingMethod : {
            1 : "Not defined",
            2 : "One-chip color area sensor",
            3 : "Two-chip color area sensor",
            4 : "Three-chip color area sensor",
            5 : "Color sequential area sensor",
            7 : "Trilinear sensor",
            8 : "Color sequential linear sensor"
        },
        SceneCaptureType : {
            0 : "Standard",
            1 : "Landscape",
            2 : "Portrait",
            3 : "Night scene"
        },
        SceneType : {
            1 : "Directly photographed"
        },
        CustomRendered : {
            0 : "Normal process",
            1 : "Custom process"
        },
        WhiteBalance : {
            0 : "Auto white balance",
            1 : "Manual white balance"
        },
        GainControl : {
            0 : "None",
            1 : "Low gain up",
            2 : "High gain up",
            3 : "Low gain down",
            4 : "High gain down"
        },
        Contrast : {
            0 : "Normal",
            1 : "Soft",
            2 : "Hard"
        },
        Saturation : {
            0 : "Normal",
            1 : "Low saturation",
            2 : "High saturation"
        },
        Sharpness : {
            0 : "Normal",
            1 : "Soft",
            2 : "Hard"
        },
        SubjectDistanceRange : {
            0 : "Unknown",
            1 : "Macro",
            2 : "Close view",
            3 : "Distant view"
        },
        FileSource : {
            3 : "DSC"
        },

        Components : {
            0 : "",
            1 : "Y",
            2 : "Cb",
            3 : "Cr",
            4 : "R",
            5 : "G",
            6 : "B"
        }
    };

    function addEvent(element, event, handler) {
        if (element.addEventListener) {
            element.addEventListener(event, handler, false);
        } else if (element.attachEvent) {
            element.attachEvent("on" + event, handler);
        }
    }

    function imageHasData(img) {
        return !!(img.exifdata);
    }


    function base64ToArrayBuffer(base64, contentType) {
        contentType = contentType || base64.match(/^data\:([^\;]+)\;base64,/mi)[1] || ''; // e.g. 'data:image/jpeg;base64,...' => 'image/jpeg'
        base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
        var binary = atob(base64);
        var len = binary.length;
        var buffer = new ArrayBuffer(len);
        var view = new Uint8Array(buffer);
        for (var i = 0; i < len; i++) {
            view[i] = binary.charCodeAt(i);
        }
        return buffer;
    }

    function objectURLToBlob(url, callback) {
        var http = new XMLHttpRequest();
        http.open("GET", url, true);
        http.responseType = "blob";
        http.onload = function(e) {
            if (this.status == 200 || this.status === 0) {
                callback(this.response);
            }
        };
        http.send();
    }

    function getImageData(img, callback) {
        function handleBinaryFile(binFile) {
            var data = findEXIFinJPEG(binFile);
            var iptcdata = findIPTCinJPEG(binFile);
            img.exifdata = data || {};
            img.iptcdata = iptcdata || {};
            if (callback) {
                callback.call(img);
            }
        }

        if (img.src) {
            if (/^data\:/i.test(img.src)) { // Data URI
                var arrayBuffer = base64ToArrayBuffer(img.src);
                handleBinaryFile(arrayBuffer);

            } else if (/^blob\:/i.test(img.src)) { // Object URL
                var fileReader = new FileReader();
                fileReader.onload = function(e) {
                    handleBinaryFile(e.target.result);
                };
                objectURLToBlob(img.src, function (blob) {
                    fileReader.readAsArrayBuffer(blob);
                });
            } else {
                var http = new XMLHttpRequest();
                http.onload = function() {
                    if (this.status == 200 || this.status === 0) {
                        handleBinaryFile(http.response);
                    } else {
                        throw "Could not load image";
                    }
                    http = null;
                };
                http.open("GET", img.src, true);
                http.responseType = "arraybuffer";
                http.send(null);
            }
        } else if (window.FileReader && (img instanceof window.Blob || img instanceof window.File)) {
            var fileReader = new FileReader();
            fileReader.onload = function(e) {
                if (debug) console.log("Got file of length " + e.target.result.byteLength);
                handleBinaryFile(e.target.result);
            };

            fileReader.readAsArrayBuffer(img);
        }
    }

    function findEXIFinJPEG(file) {
        var dataView = new DataView(file);

        if (debug) console.log("Got file of length " + file.byteLength);
        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
            if (debug) console.log("Not a valid JPEG");
            return false; // not a valid jpeg
        }

        var offset = 2,
            length = file.byteLength,
            marker;

        while (offset < length) {
            if (dataView.getUint8(offset) != 0xFF) {
                if (debug) console.log("Not a valid marker at offset " + offset + ", found: " + dataView.getUint8(offset));
                return false; // not a valid marker, something is wrong
            }

            marker = dataView.getUint8(offset + 1);
            if (debug) console.log(marker);

            // we could implement handling for other markers here,
            // but we're only looking for 0xFFE1 for EXIF data

            if (marker == 225) {
                if (debug) console.log("Found 0xFFE1 marker");

                return readEXIFData(dataView, offset + 4, dataView.getUint16(offset + 2) - 2);

                // offset += 2 + file.getShortAt(offset+2, true);

            } else {
                offset += 2 + dataView.getUint16(offset+2);
            }

        }

    }

    function findIPTCinJPEG(file) {
        var dataView = new DataView(file);

        if (debug) console.log("Got file of length " + file.byteLength);
        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
            if (debug) console.log("Not a valid JPEG");
            return false; // not a valid jpeg
        }

        var offset = 2,
            length = file.byteLength;


        var isFieldSegmentStart = function(dataView, offset){
            return (
                dataView.getUint8(offset) === 0x38 &&
                dataView.getUint8(offset+1) === 0x42 &&
                dataView.getUint8(offset+2) === 0x49 &&
                dataView.getUint8(offset+3) === 0x4D &&
                dataView.getUint8(offset+4) === 0x04 &&
                dataView.getUint8(offset+5) === 0x04
            );
        };

        while (offset < length) {

            if ( isFieldSegmentStart(dataView, offset )){

                // Get the length of the name header (which is padded to an even number of bytes)
                var nameHeaderLength = dataView.getUint8(offset+7);
                if(nameHeaderLength % 2 !== 0) nameHeaderLength += 1;
                // Check for pre photoshop 6 format
                if(nameHeaderLength === 0) {
                    // Always 4
                    nameHeaderLength = 4;
                }

                var startOffset = offset + 8 + nameHeaderLength;
                var sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength);

                return readIPTCData(file, startOffset, sectionLength);

                break;

            }


            // Not the marker, continue searching
            offset++;

        }

    }
    var IptcFieldMap = {
        0x78 : 'caption',
        0x6E : 'credit',
        0x19 : 'keywords',
        0x37 : 'dateCreated',
        0x50 : 'byline',
        0x55 : 'bylineTitle',
        0x7A : 'captionWriter',
        0x69 : 'headline',
        0x74 : 'copyright',
        0x0F : 'category'
    };
    function readIPTCData(file, startOffset, sectionLength){
        var dataView = new DataView(file);
        var data = {};
        var fieldValue, fieldName, dataSize, segmentType, segmentSize;
        var segmentStartPos = startOffset;
        while(segmentStartPos < startOffset+sectionLength) {
            if(dataView.getUint8(segmentStartPos) === 0x1C && dataView.getUint8(segmentStartPos+1) === 0x02){
                segmentType = dataView.getUint8(segmentStartPos+2);
                if(segmentType in IptcFieldMap) {
                    dataSize = dataView.getInt16(segmentStartPos+3);
                    segmentSize = dataSize + 5;
                    fieldName = IptcFieldMap[segmentType];
                    fieldValue = getStringFromDB(dataView, segmentStartPos+5, dataSize);
                    // Check if we already stored a value with this name
                    if(data.hasOwnProperty(fieldName)) {
                        // Value already stored with this name, create multivalue field
                        if(data[fieldName] instanceof Array) {
                            data[fieldName].push(fieldValue);
                        }
                        else {
                            data[fieldName] = [data[fieldName], fieldValue];
                        }
                    }
                    else {
                        data[fieldName] = fieldValue;
                    }
                }

            }
            segmentStartPos++;
        }
        return data;
    }



    function readTags(file, tiffStart, dirStart, strings, bigEnd) {
        var entries = file.getUint16(dirStart, !bigEnd),
            tags = {},
            entryOffset, tag,
            i;

        for (i=0;i<entries;i++) {
            entryOffset = dirStart + i*12 + 2;
            tag = strings[file.getUint16(entryOffset, !bigEnd)];
            if (!tag && debug) console.log("Unknown tag: " + file.getUint16(entryOffset, !bigEnd));
            tags[tag] = readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd);
        }
        return tags;
    }


    function readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd) {
        var type = file.getUint16(entryOffset+2, !bigEnd),
            numValues = file.getUint32(entryOffset+4, !bigEnd),
            valueOffset = file.getUint32(entryOffset+8, !bigEnd) + tiffStart,
            offset,
            vals, val, n,
            numerator, denominator;

        switch (type) {
            case 1: // byte, 8-bit unsigned int
            case 7: // undefined, 8-bit byte, value depending on field
                if (numValues == 1) {
                    return file.getUint8(entryOffset + 8, !bigEnd);
                } else {
                    offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                    vals = [];
                    for (n=0;n<numValues;n++) {
                        vals[n] = file.getUint8(offset + n);
                    }
                    return vals;
                }

            case 2: // ascii, 8-bit byte
                offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                return getStringFromDB(file, offset, numValues-1);

            case 3: // short, 16 bit int
                if (numValues == 1) {
                    return file.getUint16(entryOffset + 8, !bigEnd);
                } else {
                    offset = numValues > 2 ? valueOffset : (entryOffset + 8);
                    vals = [];
                    for (n=0;n<numValues;n++) {
                        vals[n] = file.getUint16(offset + 2*n, !bigEnd);
                    }
                    return vals;
                }

            case 4: // long, 32 bit int
                if (numValues == 1) {
                    return file.getUint32(entryOffset + 8, !bigEnd);
                } else {
                    vals = [];
                    for (n=0;n<numValues;n++) {
                        vals[n] = file.getUint32(valueOffset + 4*n, !bigEnd);
                    }
                    return vals;
                }

            case 5:    // rational = two long values, first is numerator, second is denominator
                if (numValues == 1) {
                    numerator = file.getUint32(valueOffset, !bigEnd);
                    denominator = file.getUint32(valueOffset+4, !bigEnd);
                    val = new Number(numerator / denominator);
                    val.numerator = numerator;
                    val.denominator = denominator;
                    return val;
                } else {
                    vals = [];
                    for (n=0;n<numValues;n++) {
                        numerator = file.getUint32(valueOffset + 8*n, !bigEnd);
                        denominator = file.getUint32(valueOffset+4 + 8*n, !bigEnd);
                        vals[n] = new Number(numerator / denominator);
                        vals[n].numerator = numerator;
                        vals[n].denominator = denominator;
                    }
                    return vals;
                }

            case 9: // slong, 32 bit signed int
                if (numValues == 1) {
                    return file.getInt32(entryOffset + 8, !bigEnd);
                } else {
                    vals = [];
                    for (n=0;n<numValues;n++) {
                        vals[n] = file.getInt32(valueOffset + 4*n, !bigEnd);
                    }
                    return vals;
                }

            case 10: // signed rational, two slongs, first is numerator, second is denominator
                if (numValues == 1) {
                    return file.getInt32(valueOffset, !bigEnd) / file.getInt32(valueOffset+4, !bigEnd);
                } else {
                    vals = [];
                    for (n=0;n<numValues;n++) {
                        vals[n] = file.getInt32(valueOffset + 8*n, !bigEnd) / file.getInt32(valueOffset+4 + 8*n, !bigEnd);
                    }
                    return vals;
                }
        }
    }

    function getStringFromDB(buffer, start, length) {
        var outstr = "";
        for (n = start; n < start+length; n++) {
            outstr += String.fromCharCode(buffer.getUint8(n));
        }
        return outstr;
    }

    function readEXIFData(file, start) {
        if (getStringFromDB(file, start, 4) != "Exif") {
            if (debug) console.log("Not valid EXIF data! " + getStringFromDB(file, start, 4));
            return false;
        }

        var bigEnd,
            tags, tag,
            exifData, gpsData,
            tiffOffset = start + 6;

        // test for TIFF validity and endianness
        if (file.getUint16(tiffOffset) == 0x4949) {
            bigEnd = false;
        } else if (file.getUint16(tiffOffset) == 0x4D4D) {
            bigEnd = true;
        } else {
            if (debug) console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)");
            return false;
        }

        if (file.getUint16(tiffOffset+2, !bigEnd) != 0x002A) {
            if (debug) console.log("Not valid TIFF data! (no 0x002A)");
            return false;
        }

        var firstIFDOffset = file.getUint32(tiffOffset+4, !bigEnd);

        if (firstIFDOffset < 0x00000008) {
            if (debug) console.log("Not valid TIFF data! (First offset less than 8)", file.getUint32(tiffOffset+4, !bigEnd));
            return false;
        }

        tags = readTags(file, tiffOffset, tiffOffset + firstIFDOffset, TiffTags, bigEnd);

        if (tags.ExifIFDPointer) {
            exifData = readTags(file, tiffOffset, tiffOffset + tags.ExifIFDPointer, ExifTags, bigEnd);
            for (tag in exifData) {
                switch (tag) {
                    case "LightSource" :
                    case "Flash" :
                    case "MeteringMode" :
                    case "ExposureProgram" :
                    case "SensingMethod" :
                    case "SceneCaptureType" :
                    case "SceneType" :
                    case "CustomRendered" :
                    case "WhiteBalance" :
                    case "GainControl" :
                    case "Contrast" :
                    case "Saturation" :
                    case "Sharpness" :
                    case "SubjectDistanceRange" :
                    case "FileSource" :
                        exifData[tag] = StringValues[tag][exifData[tag]];
                        break;

                    case "ExifVersion" :
                    case "FlashpixVersion" :
                        exifData[tag] = String.fromCharCode(exifData[tag][0], exifData[tag][1], exifData[tag][2], exifData[tag][3]);
                        break;

                    case "ComponentsConfiguration" :
                        exifData[tag] =
                            StringValues.Components[exifData[tag][0]] +
                            StringValues.Components[exifData[tag][1]] +
                            StringValues.Components[exifData[tag][2]] +
                            StringValues.Components[exifData[tag][3]];
                        break;
                }
                tags[tag] = exifData[tag];
            }
        }

        if (tags.GPSInfoIFDPointer) {
            gpsData = readTags(file, tiffOffset, tiffOffset + tags.GPSInfoIFDPointer, GPSTags, bigEnd);
            for (tag in gpsData) {
                switch (tag) {
                    case "GPSVersionID" :
                        gpsData[tag] = gpsData[tag][0] +
                            "." + gpsData[tag][1] +
                            "." + gpsData[tag][2] +
                            "." + gpsData[tag][3];
                        break;
                }
                tags[tag] = gpsData[tag];
            }
        }

        return tags;
    }

    EXIF.getData = function(img, callback) {
        if ((img instanceof Image || img instanceof HTMLImageElement) && !img.complete) return false;

        if (!imageHasData(img)) {
            getImageData(img, callback);
        } else {
            if (callback) {
                callback.call(img);
            }
        }
        return true;
    }

    EXIF.getTag = function(img, tag) {
        if (!imageHasData(img)) return;
        return img.exifdata[tag];
    }

    EXIF.getAllTags = function(img) {
        if (!imageHasData(img)) return {};
        var a,
            data = img.exifdata,
            tags = {};
        for (a in data) {
            if (data.hasOwnProperty(a)) {
                tags[a] = data[a];
            }
        }
        return tags;
    }

    EXIF.pretty = function(img) {
        if (!imageHasData(img)) return "";
        var a,
            data = img.exifdata,
            strPretty = "";
        for (a in data) {
            if (data.hasOwnProperty(a)) {
                if (typeof data[a] == "object") {
                    if (data[a] instanceof Number) {
                        strPretty += a + " : " + data[a] + " [" + data[a].numerator + "/" + data[a].denominator + "]\r\n";
                    } else {
                        strPretty += a + " : [" + data[a].length + " values]\r\n";
                    }
                } else {
                    strPretty += a + " : " + data[a] + "\r\n";
                }
            }
        }
        return strPretty;
    }

    EXIF.readFromBinaryFile = function(file) {
        return findEXIFinJPEG(file);
    }

    if (typeof define === 'function' && define.amd) {
        define('exif-js', [], function() {
            return EXIF;
        });
    }
}.call(this));
/**
 * lrz3
 * https://github.com/think2011/localResizeIMG3
 * @author think2011
 */
;
(function() {
    window.URL = window.URL || window.webkitURL;
    var ua = detect.parse(navigator.userAgent);

    /**
     * 客户端压缩图片
     * @param file
     * @param [options]
     * @constructor
     */
    function Lrz(file, options) {
      this.file = file;
      this.defaults = {
        quality: 0.7,
        // width: 1000,
        // height: 1000,
        done: null,
        fail: null,
        before: null,
        always: null
      };

      for (var p in options) {
        this.defaults[p] = options[p];
      }
      if (this.defaults.quality > 1) this.defaults.quality = 1;

      this.results = {
        origin: null,
        base64: null,
        base64Len: null
      };

      this.init();
    }

    Lrz.prototype = {
      constructor: Lrz,

      /**
       * 初始化
       */
      init: function() {
        var that = this;

        // 简单的兼容性检测
        if(typeof window.URL === 'undefined' ||
          typeof document.createElement('canvas').getContext !== 'function'){
          var error = new Error('不支持此设备');

          // 错误回调
          if (typeof that.defaults.fail === 'function') {
            that.defaults.fail(error);
          }

          // 压缩结束回调
          if (typeof that.defaults.always === 'function') {
            that.defaults.always();
          }

          return;
        }

        that.create(that.file);
      },

      /**
       * 生成base64
       * @param file
       * @param callback
       */
      create: function(file) {
        var that = this,
          img = new Image(),
          results = that.results,
          blob = (typeof file === 'string') ? file : URL.createObjectURL(file);

        img.crossOrigin = "*";
        img.onerror = function() {
          var error = new Error('图片加载失败');
          // 读取文件失败
          if (typeof that.defaults.fail === 'function') {
            that.defaults.fail(error);
          }

          // 压缩结束回调
          if (typeof that.defaults.always === 'function') {
            that.defaults.always();
          }
        };
        img.onload = function() {

            EXIF.getData(img, function() {
                var orientation = EXIF.getTag(this, "Orientation");
                // 获得图片缩放尺寸
                var resize = that.resize(this, orientation);
                // 初始化canvas
                var canvas = document.createElement('canvas'),
                  ctx;

                canvas.width = resize.w;
                canvas.height = resize.h;
                ctx = canvas.getContext('2d');

                // 渲染画布
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, resize.w, resize.h);

                // 生成结果
                results.origin = file;

                // 兼容iOS6/iOS7
                if (ua.os.family === 'iOS' && parseInt(ua.os.version) < 8) {

                  var mpImg = new MegaPixImage(img);
                  if("5678".indexOf(orientation) > -1){
                    mpImg.render(canvas, {
                        width: canvas.height,
                        height: canvas.width,
                        orientation: orientation
                      });
                  }else{
                    mpImg.render(canvas, {
                        width: canvas.width,
                        height: canvas.height,
                        orientation: orientation
                      });
                  }

                  results.base64 = canvas.toDataURL('image/jpeg', that.defaults.quality);

                  // 执行回调
                  _resultCallback(results);

                }
                // 其他设备&IOS8+
                else {
                  switch (orientation) {
                    case 3:
                      ctx.rotate(180 * Math.PI / 180);
                      ctx.drawImage(img, -resize.w, -resize.h, resize.w, resize.h);
                      break;
                    case 6:
                      ctx.rotate(90 * Math.PI / 180);
                      ctx.drawImage(img, 0, -resize.w, resize.h, resize.w);
                      break;
                    case 8:
                      ctx.rotate(270 * Math.PI / 180);
                      ctx.drawImage(img, -resize.h, 0, resize.h, resize.w);
                      break;

                    case 2:
                      ctx.translate(resize.w, 0);
                      ctx.scale(-1, 1);
                      ctx.drawImage(img, 0, 0, resize.w, resize.h);
                      break;
                    case 4:
                      ctx.translate(resize.w, 0);
                      ctx.scale(-1, 1);
                      ctx.rotate(180 * Math.PI / 180);
                      ctx.drawImage(img, -resize.w, -resize.h, resize.w, resize.h);
                      break;
                    case 5:
                      ctx.translate(resize.w, 0);
                      ctx.scale(-1, 1);
                      ctx.rotate(90 * Math.PI / 180);
                      ctx.drawImage(img, 0, -resize.w, resize.h, resize.w);
                      break;
                    case 7:
                      ctx.translate(resize.w, 0);
                      ctx.scale(-1, 1);
                      ctx.rotate(270 * Math.PI / 180);
                      ctx.drawImage(img, -resize.h, 0, resize.h, resize.w);
                      break;

                    default:
                      ctx.drawImage(img, 0, 0, resize.w, resize.h);
                  }

                  if (ua.os.family === 'Android' && ua.os.version.slice(0, 3) < 4.5) {
                    var encoder = new JPEGEncoder();
                    results.base64 = encoder.encode(ctx.getImageData(0, 0, canvas.width, canvas.height), that.defaults.quality * 100);
                  } else {
                    results.base64 = canvas.toDataURL('image/jpeg', that.defaults.quality);
                  }

                  // 执行回调
                  _resultCallback(results);

                }
              });


              /**
               * 包装回调
               */
              function _resultCallback(results) {
                // 释放内存
                canvas = null;
                img = null;
                URL.revokeObjectURL(blob);

                // 加入base64Len，方便后台校验是否传输完整
                results.base64Len = results.base64.length;

                // 压缩成功回调
                if (typeof that.defaults.done === 'function') {
                  that.defaults.done(results);
                }

                // 压缩结束回调
                if (typeof that.defaults.always === 'function') {
                  that.defaults.always();
                }
              }
            };

            // 压缩开始前回调
            if (typeof this.defaults.before === 'function') {
              this.defaults.before();
            }
            
            img.src = blob;
          },

          /**
           * 获得图片的缩放尺寸
           * @param img
           * @returns {{w: (Number), h: (Number)}}
           */
          resize: function(img, orientation) {
            var w = this.defaults.width,
              h = this.defaults.height,
              ret = {
                w: img.width,
                h: img.height
              };

            if("5678".indexOf(orientation) > -1){
              ret.w = img.height;
              ret.h = img.width;
            }

            var scale = ret.w / ret.h;

            if (w && h) {
              if (scale >= w / h) {
                if (ret.w > w) {
                  ret.w = w;
                  ret.h = Math.ceil(w / scale);
                }
              } else {
                if (ret.h > h) {
                  ret.h = h;
                  ret.w = Math.ceil(h * scale);
                }
              }
            } else if (w) {
              if(w < ret.w){
                ret.w = w;
                ret.h = Math.ceil(w / scale);
              }
            } else if (h) {
              if(h < ret.h){
                ret.w = Math.ceil(h * scale);
                ret.h = h;
              }
            }

            // 超过这个值base64无法生成，在IOS上
            if (ret.w >= 3264 || ret.h >= 2448) {
              ret.w *= 0.8;
              ret.h *= 0.8;
            }

            return ret;
        }
      };

      // 暴露接口
      window.lrz = function(file, options) {
        return new Lrz(file, options);
      };
    })();