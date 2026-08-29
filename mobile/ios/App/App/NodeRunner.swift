//
//  NodeRunner.swift
//  App
//
//  (c) Jackdaw
//

import Foundation
import NodeMobile

@objc public class NodeRunner: NSObject {
    private static var nodeStarted = false

    @objc public static func startNode() {
        // Prevent double-start
        guard !nodeStarted else { return }
        nodeStarted = true

        // Run on a background thread so we don’t block the UI
        DispatchQueue.global(qos: .default).async {
                // —— DEBUG: list contents of nodejs-project folder ——
                if let folderURL = Bundle.main.resourceURL?.appendingPathComponent("nodejs-project") {
                    if let items = try? FileManager.default.contentsOfDirectory(atPath: folderURL.path) {
                        print("📂 nodejs-project contains: \(items)")
                    } else {
                        print("❌ Could not read nodejs-project folder at \(folderURL.path)")
                    }
                } else {
                    print("❌ nodejs-project folder not found in bundle")
                }

                // —— attempt to find index.mjs ——
                guard let scriptPath = Bundle.main.path(
                        forResource: "index",
                        ofType: "mjs",
                        inDirectory: "nodejs-project"
                      ) else {
                    print("❌ NodeRunner: could not find index.mjs in nodejs-project")
                    return
                }
            
                let overrideDLOpenScript = "override-dlopen-paths-preload.js"
                // —— attempt to find override-dlopen-paths-preload.js ——
                guard let overrideDLOpenPath = Bundle.main.path(
                        forResource: "override-dlopen-paths-preload",
                        ofType: "js",
                        inDirectory: "nodejs-project"
                      ) else {
                    print("❌ NodeRunner: could not find override-dlopen-paths-preload.js in nodejs-project")
                    return
                }


            // Prepare argv: ["node", "<full-path-to-index.mjs>"]
            let args = ["node", "-r", overrideDLOpenPath, scriptPath]
            let argc = Int32(args.count)
            let argv = UnsafeMutablePointer<UnsafeMutablePointer<Int8>?>.allocate(capacity: Int(argc))
            for (i, arg) in args.enumerated() {
                argv[i] = strdup(arg)
            }

            // Launch the embedded Node.js runtime
            node_start(argc, argv)
        }
    }
}
