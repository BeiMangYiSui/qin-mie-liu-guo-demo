#import <AppKit/AppKit.h>
#import <Foundation/Foundation.h>
#import <Vision/Vision.h>
#import <sys/stat.h>

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc < 3) {
            fprintf(stderr, "usage: ocr-private-documents output.json image...\n");
            return 2;
        }
        NSString *output = [NSString stringWithUTF8String:argv[1]];
        NSMutableArray *results = [NSMutableArray array];
        for (int i = 2; i < argc; i++) {
            NSString *path = [NSString stringWithUTF8String:argv[i]];
            NSImage *image = [[NSImage alloc] initWithContentsOfFile:path];
            NSMutableArray *lines = [NSMutableArray array];
            if (image) {
                NSRect rect = NSMakeRect(0, 0, image.size.width, image.size.height);
                CGImageRef cgImage = [image CGImageForProposedRect:&rect context:nil hints:nil];
                if (cgImage) {
                    VNRecognizeTextRequest *request = [[VNRecognizeTextRequest alloc] init];
                    request.recognitionLevel = VNRequestTextRecognitionLevelAccurate;
                    request.usesLanguageCorrection = YES;
                    request.recognitionLanguages = @[@"zh-Hans", @"en-US"];
                    VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCGImage:cgImage options:@{}];
                    NSError *error = nil;
                    [handler performRequests:@[request] error:&error];
                    if (!error) {
                        NSArray<VNRecognizedTextObservation *> *observations = request.results ?: @[];
                        observations = [observations sortedArrayUsingComparator:^NSComparisonResult(VNRecognizedTextObservation *a, VNRecognizedTextObservation *b) {
                            CGFloat delta = CGRectGetMidY(a.boundingBox) - CGRectGetMidY(b.boundingBox);
                            if (fabs(delta) > 0.015) return delta > 0 ? NSOrderedAscending : NSOrderedDescending;
                            return CGRectGetMinX(a.boundingBox) < CGRectGetMinX(b.boundingBox) ? NSOrderedAscending : NSOrderedDescending;
                        }];
                        for (VNRecognizedTextObservation *observation in observations) {
                            VNRecognizedText *candidate = [[observation topCandidates:1] firstObject];
                            if (candidate.string.length) [lines addObject:candidate.string];
                        }
                    }
                }
            }
            [results addObject:@{@"filename": path.lastPathComponent, @"lines": lines}];
        }
        NSError *jsonError = nil;
        NSData *data = [NSJSONSerialization dataWithJSONObject:results options:NSJSONWritingPrettyPrinted error:&jsonError];
        if (!data || ![data writeToFile:output options:NSDataWritingAtomic error:&jsonError]) {
            fprintf(stderr, "failed to write OCR results\n");
            return 1;
        }
        chmod(output.fileSystemRepresentation, S_IRUSR | S_IWUSR);
        printf("OCR completed for %d local images; content was written privately.\n", argc - 2);
    }
    return 0;
}
